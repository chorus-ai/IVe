export default function deepCopy(obj: any) {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  const newObj = Array.isArray(obj) ? [] : {};

  for (let key in obj) {
    newObj[key] = deepCopy(obj[key]);
  }

  return newObj;
}
