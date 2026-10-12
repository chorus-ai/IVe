const fs = require("fs");
const path = require("path");

const dotenv = require("dotenv");
dotenv.config();

const util = require("util");
const astat = util.promisify(fs.stat);
const areaddir = util.promisify(fs.readdir);

const maxFilesReturned = 200;

const sortFiles = (files) => {
  // Helper function to extract numerical and string parts of a path for comparison
  const extractKey = (str) => str.match(/\d+|[^\d]+/g).map((chunk) => (isNaN(chunk) ? chunk : Number(chunk)));

  // Custom comparison for natural sorting
  const naturalCompare = (a, b) => {
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

  return files.sort((a, b) => {
    return naturalCompare(a, b);
  });
};

async function getFiles(dir) {
  // Get this directory's contents
  let files = await areaddir(dir);
  files = sortFiles(files);
  const fileLength = files.length;
  if (fileLength > maxFilesReturned) {
    // remove files from the list if there are too many
    files.splice(maxFilesReturned, fileLength - maxFilesReturned);
  }
  const fileDetails = await Promise.all(
    files
      .map((f) => path.join(dir, f))
      .map(async (f) => {
        const stats = await astat(f);
        return stats.isDirectory()
          ? { type: "dir", path: f.replace(dir + "/", "") }
          : { type: "file", path: f.replace(dir + "/", "") };
      })
  );


  return { fileLength, files: fileDetails };
}

exports.findAll = (req, res) => {
  getFiles(
    req.params[0]
      ? path.join(process.env.BUCKET_PATH, req.params[0])
      : process.env.BUCKET_PATH
  )
    .then(({ fileLength, files }) => {
      if (files) {
        res.send({ fileLength, files });
      } else {
        res.send({ fileLength: 0, files: [] });
      }
    })
    .catch((err) => {
      console.log(
        "There was an error getting bucket files",
        JSON.stringify(err)
      );
      res.sendStatus(500);
    });
};
const {
  S3Client,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

// Build S3 client config: use explicit region + credentials from env when
// provided (local dev), otherwise fall back to the default provider chain
// (EC2 instance role / ~/.aws) on deployed hosts.
function buildS3Config() {
  const config = {};
  if (process.env.AWS_REGION) config.region = process.env.AWS_REGION;
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      ...(process.env.AWS_SESSION_TOKEN
        ? { sessionToken: process.env.AWS_SESSION_TOKEN }
        : {}),
    };
  }
  return config;
}

const s3 = new S3Client(buildS3Config());

const BUCKET = process.env.BUCKET_NAME || "your-bucket-name";

// helper for GetObject
function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (c) => chunks.push(c));
    stream.on("error", reject);
    stream.on("end", () =>
      resolve(Buffer.concat(chunks).toString("utf-8"))
    );
  });
}

function pickFileName(key) {
  const parts = String(key || "").split("/");
  return parts[parts.length - 1] || "file";
}

exports.health = async (req, res) => {
  try {
     await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
 
     const out = await s3.send(
       new ListObjectsV2Command({
         Bucket: BUCKET,
         MaxKeys: 5,
       })
     );
 
     res.json({
       ok: true,
       bucket: BUCKET,
       sampleKeys: (out.Contents || []).map(o => o.Key),
     });
   } catch (err) {
     res.status(500).json({
       ok: false,
       error: err.name,
       message: err.message,
     });
   }
};    

exports.listObjects = async (req, res) => {
try {
  let prefix = req.params.prefix || "";

  // normalize prefix: remove leading "/" and ensure trailing "/" for folder-like listing
  prefix = String(prefix).replace(/^\/+/, "");
  if (prefix && !prefix.endsWith("/")) prefix += "/";

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 50, 1), 1000);

  let continuationToken;
  let currentPage = 1;
  let result;

  // Walk S3 pages until we reach requested page
  while (currentPage <= page) {
    result = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        Delimiter: "/",
        MaxKeys: pageSize,
        ContinuationToken: continuationToken,
      })
    );

    if (currentPage === page) break;
    if (!result.IsTruncated) break;

    continuationToken = result.NextContinuationToken;
    currentPage++;
  }

  const folders = (result?.CommonPrefixes || []).map(p => p.Prefix);

  const files = (result?.Contents || [])
    // remove the "folder marker object" (zero byte object equal to the prefix)
    .filter(f => !(f.Key === prefix && f.Size === 0))
    // remove mac junk
    .filter(f => !f.Key.endsWith(".DS_Store"))
    .filter(f => !f.Key.includes("__MACOSX/"))
    .map(f => ({
      key: f.Key,
      size: f.Size,
      lastModified: f.LastModified,
    }));

  res.json({
    ok: true,
    bucket: BUCKET,
    prefix,
    page,
    pageSize,
    isLastPage: !result?.IsTruncated,
    nextPage: result?.IsTruncated ? page + 1 : null,
    folders,
    files,
  });
} catch (err) {
  res.status(500).json({
    ok: false,
    message: err.message,
  });
}
};

exports.readFile = async (req, res) => {
  try {
     const out = await s3.send(
       new GetObjectCommand({
         Bucket: BUCKET,
         Key: req.params.key,
       })
     );
 
     const text = await streamToString(out.Body);
     res.json({ ok: true, key: req.params.key, content: text });
   } catch (err) {
     res.status(500).json({ ok: false, message: err.message });
   }
};

exports.uploadFile = async (req, res) => {
  try {
      const { key, content } = req.body;
      if (!key) return res.status(400).json({ error: "key required" });
  
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: typeof content === "string"
            ? content
            : JSON.stringify(content),
          ContentType: "application/json",
        })
      );
  
      res.json({ ok: true, key });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
};


exports.downloadFile = async (req, res) => {
  const key = req.query.key;
  try {
    const out = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${pickFileName(key)}"`
    );
    out.Body.pipe(res);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.deleteFile = async (req, res) => {
  const key = req.query.key;
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
    res.send({ message: "success", key: key });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }   
};  

