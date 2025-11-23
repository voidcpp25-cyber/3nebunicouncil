// Enhanced ELO rating calculation to reduce ties
const BASE_K_FACTOR = 150; // Increased base K factor for more dramatic changes

export function calculateElo(
  winnerElo: number,
  loserElo: number
): { newWinnerElo: number; newLoserElo: number } {
  const eloDiff = winnerElo - loserElo;
  
  // Dynamic K factor - larger changes for closer ratings to reduce ties
  // When ratings are close, use much higher K factor to create separation
  let kFactor = BASE_K_FACTOR;
  if (Math.abs(eloDiff) < 50) {
    // Very close ratings - use much higher K to create separation
    kFactor = BASE_K_FACTOR * 2.0;
  } else if (Math.abs(eloDiff) < 100) {
    // Close ratings - use higher K
    kFactor = BASE_K_FACTOR * 1.8;
  } else if (Math.abs(eloDiff) < 200) {
    // Moderately close ratings
    kFactor = BASE_K_FACTOR * 1.4;
  }
  
  // Calculate expected scores
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));
  
  // Upset bonus - if lower rated wins, give extra points
  let upsetBonus = 0;
  if (eloDiff < 0) {
    // Upset! Lower rated beat higher rated
    upsetBonus = Math.abs(eloDiff) * 0.15; // 15% of the difference as bonus
  }
  
  // Calculate new ratings
  let newWinnerElo = winnerElo + kFactor * (1 - expectedWinner) + upsetBonus;
  let newLoserElo = loserElo + kFactor * (0 - expectedLoser) - (upsetBonus * 0.5);
  
  // Ensure minimum change to reduce ties - increased minimum
  const minChange = 25; // Increased from 15 to 25
  const winnerChange = newWinnerElo - winnerElo;
  const loserChange = newLoserElo - loserElo;
  
  // Apply minimum change
  if (winnerChange < minChange) {
    newWinnerElo = winnerElo + minChange;
  }
  if (Math.abs(loserChange) < minChange) {
    newLoserElo = loserElo - minChange;
  }
  
  // Tie-breaking: Add small random component (1-3 points) to prevent exact ties
  // This ensures even if two jokes have identical expected performance,
  // they'll get slightly different scores
  const tieBreaker = Math.floor(Math.random() * 3) + 1; // 1-3 points
  newWinnerElo += tieBreaker;
  newLoserElo -= Math.floor(tieBreaker / 2); // Smaller reduction for loser

  return {
    newWinnerElo: Math.round(newWinnerElo),
    newLoserElo: Math.round(newLoserElo),
  };
}

