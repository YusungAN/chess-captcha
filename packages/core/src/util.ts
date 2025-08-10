export function getRandomInt(min: number, max: number) {
  const randVal = new Uint32Array(1);
  crypto.getRandomValues(randVal);
  return (randVal[0] % (max - min + 1)) + min;
}
