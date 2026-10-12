/**
 * Study index: Orthanc's hierarchy, shaped for the viewer and stripped of PHI.
 *
 * Orthanc is the index — there are no dicom tables in this repo. That is the
 * main simplification of choosing a PACS over a filesystem scan.
 */

const orthanc = require("../../../utils/orthanc");
const { getCached, setCached } = require("../../../utils/cache");
const meta = require("./metadata");

const STUDY_TTL_SECONDS = 300;

/**
 * Sort by InstanceNumber, falling back to SliceLocation.
 *
 * Never sort by filename or by Orthanc id: scanner exports are not
 * lexicographically ordered and Orthanc ids are content hashes, so either
 * produces a scrambled stack that still looks plausible.
 */
const byInstanceNumber = (a, b) => {
  const an = Number(a.MainDicomTags?.InstanceNumber);
  const bn = Number(b.MainDicomTags?.InstanceNumber);
  if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) return an - bn;

  const al = Number(a.MainDicomTags?.SliceLocation);
  const bl = Number(b.MainDicomTags?.SliceLocation);
  if (Number.isFinite(al) && Number.isFinite(bl) && al !== bl) return al - bl;

  return 0;
};

/**
 * Modalities that carry no pixel data. Orthanc answers 415 for their
 * instances, so a viewer that offers them produces a broken frame:
 *
 *   PR  presentation state (window/level + annotations over another series)
 *   SR  structured report      KO  key object selection
 *   SEG segmentation           RTSTRUCT/RTPLAN/RTDOSE  radiotherapy objects
 *   DOC encapsulated document
 *
 * Real studies are full of these — one test set here had 59 PR series against
 * 90 image series — so this is not an edge case.
 */
const NON_IMAGE_MODALITIES = new Set([
  "PR", "SR", "KO", "SEG", "RTSTRUCT", "RTPLAN", "RTDOSE", "DOC", "REG", "FID",
]);

const isRenderable = (modality) => !NON_IMAGE_MODALITIES.has(String(modality || "").toUpperCase());

const bySeriesNumber = (a, b) => {
  const an = Number(a.MainDicomTags?.SeriesNumber);
  const bn = Number(b.MainDicomTags?.SeriesNumber);
  if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
  return 0;
};

/**
 * Full study index: study → series → instances, sorted, allowlisted.
 *
 * `patientRef` is Orthanc's own study id, deliberately **not** PatientID or
 * PatientName. An index row is the thing most likely to reach a log or an
 * export, so the real identifiers never enter it.
 */
exports.getStudyIndex = async (studyIdOrUid) => {
  const cacheKey = `dicom:study:${studyIdOrUid}`;
  const cached = await getCached(cacheKey);
  if (cached.hit) return cached.value;

  // Events store StudyInstanceUIDs; Orthanc addresses studies by its own id.
  const studyId = await orthanc.resolveStudyId(studyIdOrUid);

  const study = await orthanc.getStudy(studyId);
  const seriesList = await orthanc.getStudySeries(studyId);

  const series = [];
  for (const s of [...seriesList].sort(bySeriesNumber)) {
    const instances = await orthanc.getSeriesInstances(s.ID);
    const tags = meta.coerce(meta.seriesTags(s.MainDicomTags || {}));
    series.push({
      id: s.ID,
      ...tags,
      // Lets the client hide what it cannot draw instead of rendering a 415.
      renderable: isRenderable(tags.Modality),
      instanceCount: instances.length,
      instances: [...instances].sort(byInstanceNumber).map((i) => ({
        id: i.ID,
        instanceNumber: Number(i.MainDicomTags?.InstanceNumber) || null,
        // No tags here — the viewer fetches per-instance metadata lazily, and
        // a 600-entry index should stay small.
      })),
    });
  }

  const index = {
    id: study.ID,
    patientRef: study.ID,
    ...meta.coerce(meta.studyTags(study.MainDicomTags || {})),
    seriesCount: series.length,
    instanceCount: series.reduce((n, s) => n + s.instanceCount, 0),
    renderableSeriesCount: series.filter((s) => s.renderable).length,
    series,
  };

  await setCached(cacheKey, index, STUDY_TTL_SECONDS);
  return index;
};

/** Study list for pickers. Descriptors only — no patient identifiers. */
exports.listStudies = async () => {
  const ids = await orthanc.listStudies();
  const out = [];
  for (const id of ids) {
    const study = await orthanc.getStudy(id);
    out.push({
      id: study.ID,
      ...meta.coerce(meta.studyTags(study.MainDicomTags || {})),
      seriesCount: (study.Series || []).length,
    });
  }
  return out;
};

/** One instance's allowlisted, coerced header. */
exports.getInstanceMetadata = async (instanceId) => {
  const cacheKey = `dicom:meta:${instanceId}`;
  const cached = await getCached(cacheKey);
  if (cached.hit) return cached.value;

  const tags = await orthanc.getInstanceTags(instanceId);
  const value = meta.coerce(meta.instanceTags(tags));

  // Headers are immutable once written; cache them for a day.
  await setCached(cacheKey, value, 86400);
  return value;
};
