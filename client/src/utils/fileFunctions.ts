// import SparkMD5 from "spark-md5";

// export function fileHash(chunks) {
//   return new Promise((resolve) => {
//     const spark = new SparkMD5();
//     function _read(i) {
//       if (i >= chunks.length) {
//         resolve(spark.end());
//         return;
//       }
//       const blob = chunks[i];
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         const bytes = e.target.result;
//         spark.append(bytes);
//         _read(i + 1);
//       };
//       reader.readAsArrayBuffer(blob);
//     }

//     _read(0);
//   });
// }


export const createChunks = (file: any, chunkSize: any) => {
  const res = [];
  for (let i = 0; i < file.size; i += chunkSize) {
    res.push(file.slice(i, i + chunkSize));
  }

  return res;
}

export const readFile = (file: any) => {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => {
      res(reader.result)
    }
    reader.onerror = rej
    reader.readAsText(file)
  })
}

export const readPDF = (file: any) => {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result)
    reader.onerror = rej
    reader.readAsArrayBuffer(file)
  })
}

export const sortPaths = (paths: any, key: any) => {
  // Helper function to extract numerical and string parts of a path for comparison
  const extractKey = (str: any) => str.match(/\d+|[^\d]+/g).map((chunk: any) => (isNaN(chunk) ? chunk : Number(chunk)));

  // Custom comparison for natural sorting
  const naturalCompare = (a: any, b: any) => {
    const aParts = extractKey(a);
    const bParts = extractKey(b);
    for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
      if (aParts[i] !== bParts[i]) {
        return typeof aParts[i] === "number" && typeof bParts[i] === "number"
          ? aParts[i] - bParts[i]
          : aParts[i].localeCompare(bParts[i]);
      }
    }
    return aParts.length - bParts.length;
  };

  return paths.sort((a: any, b: any) => {
      return naturalCompare(a[key], b[key]);
    }
  );
};

