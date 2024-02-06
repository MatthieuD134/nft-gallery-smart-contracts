export default async function WAIT(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
