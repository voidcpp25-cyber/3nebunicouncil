// ELO rating calculation
const K_FACTOR = 32;

export function calculateElo(
  winnerElo: number,
  loserElo: number
): { newWinnerElo: number; newLoserElo: number } {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));

  const newWinnerElo = winnerElo + K_FACTOR * (1 - expectedWinner);
  const newLoserElo = loserElo + K_FACTOR * (0 - expectedLoser);

  return {
    newWinnerElo: Math.round(newWinnerElo),
    newLoserElo: Math.round(newLoserElo),
  };
}

