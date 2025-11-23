interface EloConfig {
  baseK?: number;
  volatilityDecay?: number;
  minGames?: number;
  confidenceThreshold?: number;
}

interface PlayerStats {
  games: number;
  recentForm?: number[]; // last 10 results (1=win, 0=loss)
  volatility?: number;
  lastActivity?: number;
}

const DEFAULT_CONFIG: Required<EloConfig> = {
  baseK: 32,
  volatilityDecay: 0.95,
  minGames: 20,
  confidenceThreshold: 0.85,
};

const clamp = (v: number, min: number, max: number) => 
  Math.max(min, Math.min(max, v));

/**
 * Advanced Elo system with:
 * - Adaptive K-factor based on experience and volatility
 * - Momentum/form tracking
 * - Confidence intervals
 * - Non-linear upset scaling
 * - Anti-inflation measures
 * - Rating compression for inactive players
 */
export function calculateAdvancedElo(
  winnerElo: number,
  loserElo: number,
  winnerStats: PlayerStats,
  loserStats: PlayerStats,
  config: EloConfig = {}
): {
  newWinnerElo: number;
  newLoserElo: number;
  confidence: number;
  momentum: { winner: number; loser: number };
  details: {
    kFactor: { winner: number; loser: number };
    expectedScore: { winner: number; loser: number };
    surpriseFactor: number;
  };
} {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // 1. Calculate experience multipliers
  const winnerExp = getExperienceMultiplier(winnerStats.games, cfg.minGames);
  const loserExp = getExperienceMultiplier(loserStats.games, cfg.minGames);

  // 2. Calculate volatility (uncertainty in rating)
  const winnerVol = calculateVolatility(winnerStats);
  const loserVol = calculateVolatility(loserStats);

  // 3. Calculate form/momentum
  const winnerForm = calculateForm(winnerStats.recentForm);
  const loserForm = calculateForm(loserStats.recentForm);

  // 4. Adjust ratings for form (temporary boost/penalty)
  const winnerAdjusted = winnerElo + winnerForm * 15;
  const loserAdjusted = loserElo + loserForm * 15;

  // 5. Expected scores with form adjustment
  const expectedWinner = 1 / (1 + Math.pow(10, (loserAdjusted - winnerAdjusted) / 400));
  const expectedLoser = 1 - expectedWinner;

  // 6. Calculate surprise factor (how unexpected was this result?)
  const ratingGap = winnerElo - loserElo;
  const surpriseFactor = calculateSurpriseFactor(ratingGap, expectedWinner);

  // 7. Adaptive K-factors
  const winnerK = calculateKFactor(
    cfg.baseK,
    winnerExp,
    winnerVol,
    surpriseFactor,
    ratingGap >= 0 ? 'favorite' : 'underdog'
  );
  
  const loserK = calculateKFactor(
    cfg.baseK,
    loserExp,
    loserVol,
    surpriseFactor,
    ratingGap >= 0 ? 'underdog' : 'favorite'
  );

  // 8. Calculate raw deltas
  let winDelta = winnerK * (1 - expectedWinner);
  let loseDelta = loserK * (0 - expectedLoser);

  // 9. Apply non-linear upset scaling
  if (ratingGap < 0) {
    // Underdog wins
    const upsetMagnitude = Math.abs(ratingGap);
    const upsetBoost = 1 + Math.log10(1 + upsetMagnitude / 100) * 0.4;
    winDelta *= upsetBoost;
    loseDelta *= upsetBoost;
  } else if (ratingGap > 100) {
    // Favorite wins - diminishing returns
    const favoriteDiscount = Math.max(0.3, 1 - Math.log10(1 + ratingGap / 150) * 0.3);
    winDelta *= favoriteDiscount;
    loseDelta *= favoriteDiscount;
  }

  // 10. Anti-inflation: slight deflation
  const inflationFactor = 0.98;
  winDelta *= inflationFactor;
  loseDelta *= inflationFactor;

  // 11. Bounds checking
  winDelta = clamp(winDelta, 2, 100);
  loseDelta = -clamp(Math.abs(loseDelta), 2, 100);

  // 12. Calculate confidence (how reliable is this rating?)
  const confidence = calculateConfidence(
    winnerStats.games,
    loserStats.games,
    winnerVol,
    loserVol,
    cfg.minGames
  );

  return {
    newWinnerElo: Math.round(winnerElo + winDelta),
    newLoserElo: Math.round(loserElo + loseDelta),
    confidence,
    momentum: {
      winner: winnerForm,
      loser: loserForm,
    },
    details: {
      kFactor: { winner: winnerK, loser: loserK },
      expectedScore: { winner: expectedWinner, loser: expectedLoser },
      surpriseFactor,
    },
  };
}

/**
 * Experience multiplier: new players have higher K
 */
function getExperienceMultiplier(games: number, minGames: number): number {
  if (games >= minGames) return 1.0;
  return 1 + (minGames - games) / minGames * 0.5; // up to 1.5x for new players
}

/**
 * Volatility: higher = less certain about true skill
 */
function calculateVolatility(stats: PlayerStats): number {
  if (stats.volatility !== undefined) {
    return stats.volatility;
  }
  
  // Estimate from games played
  const baseVol = 1 / Math.sqrt(1 + stats.games / 10);
  
  // Increase volatility if recent form is erratic
  if (stats.recentForm && stats.recentForm.length > 3) {
    const formVariance = calculateVariance(stats.recentForm);
    return baseVol * (1 + formVariance * 0.3);
  }
  
  return baseVol;
}

/**
 * Recent form score: -1 (cold) to +1 (hot)
 */
function calculateForm(recentForm?: number[]): number {
  if (!recentForm || recentForm.length === 0) return 0;
  
  // Weighted average: recent games matter more
  let weightedSum = 0;
  let weightTotal = 0;
  
  recentForm.forEach((result, i) => {
    const weight = Math.pow(0.85, recentForm.length - i - 1);
    weightedSum += result * weight;
    weightTotal += weight;
  });
  
  const avgForm = weightedSum / weightTotal;
  return (avgForm - 0.5) * 2; // map [0,1] to [-1,1]
}

/**
 * How surprising was this result?
 */
function calculateSurpriseFactor(ratingGap: number, expectedWinProb: number): number {
  // Higher surprise = outcome was less expected
  const surprise = 1 - expectedWinProb;
  
  // Boost surprise for large upsets
  if (ratingGap < -200) {
    return surprise * (1 + Math.abs(ratingGap) / 500);
  }
  
  return surprise;
}

/**
 * Adaptive K-factor based on multiple signals
 */
function calculateKFactor(
  baseK: number,
  expMultiplier: number,
  volatility: number,
  surprise: number,
  role: 'favorite' | 'underdog'
): number {
  let k = baseK;
  
  // New players get higher K
  k *= expMultiplier;
  
  // Uncertain ratings get higher K
  k *= 1 + volatility * 0.4;
  
  // Surprising results get higher K
  k *= 1 + surprise * 0.3;
  
  // Underdogs get slightly higher K when they win
  if (role === 'underdog') {
    k *= 1.1;
  }
  
  return clamp(k, 8, 80);
}

/**
 * Confidence in the rating (0-1)
 */
function calculateConfidence(
  winnerGames: number,
  loserGames: number,
  winnerVol: number,
  loserVol: number,
  minGames: number
): number {
  const gameConfidence = Math.min(
    winnerGames / minGames,
    loserGames / minGames,
    1
  );
  
  const volConfidence = 1 - (winnerVol + loserVol) / 2;
  
  return (gameConfidence * 0.6 + volConfidence * 0.4);
}


function calculateVariance(arr: number[]): number {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
  return variance;
}

/**
 * Update player volatility after a game
 */
export function updateVolatility(
  currentVolatility: number,
  expectedScore: number,
  actualScore: number,
  decay: number = 0.95
): number {
  const predictionError = Math.abs(actualScore - expectedScore);
  const newVol = currentVolatility * decay + predictionError * 0.3;
  return clamp(newVol, 0.05, 1.5);
}

/**
 * Apply rating compression for inactive players (regression to mean)
 */
export function applyInactivityCompression(
  elo: number,
  daysSinceLastGame: number,
  meanElo: number = 1500
): number {
  if (daysSinceLastGame < 30) return elo;
  
  const compressionRate = Math.min((daysSinceLastGame - 30) / 365, 0.3);
  return elo + (meanElo - elo) * compressionRate;
}

/**
 * Simple wrapper to match existing call sites:
 * Assumes neutral stats and defaults from calculateAdvancedElo.
 */
export function calculateElo(
  winnerElo: number,
  loserElo: number
): { newWinnerElo: number; newLoserElo: number } {
  const emptyStats: PlayerStats = { games: 30 };
  const result = calculateAdvancedElo(winnerElo, loserElo, emptyStats, emptyStats);
  return { newWinnerElo: result.newWinnerElo, newLoserElo: result.newLoserElo };
}
