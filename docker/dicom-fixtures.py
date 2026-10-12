# Generate a synthetic DICOM study for verifying features/dicom.
#
# Run with: python3 scripts/dicom-fixtures.py [outdir]
# Requires pydicom + numpy (already present in PYTHON_PATH: python3.10).
#
# The study is deliberately loaded with PHI so the allowlist can be proven to
# strip it — these are invented values, never real patient data. InstanceNumbers
# are 3, 1, 10, 2: out of order, and 10 is there because a string sort yields
# 1, 10, 2, 3, which renders a scrambled stack that still looks plausible.

import os
import sys

import numpy as np
from pydicom.dataset import FileDataset, FileMetaDataset
from pydicom.uid import CTImageStorage, ExplicitVRLittleEndian, generate_uid

# Values the verification asserts are absent from every API response.
PHI = {
    "PatientName": "DOE^JANE",
    "PatientID": "MRN4820193",
    "PatientBirthDate": "19580314",
    "PatientSex": "F",
    "InstitutionName": "Emory University Hospital",
    "ReferringPhysicianName": "OKAFOR^SANDRA",
    "AccessionNumber": "ACC-99",
    "StudyDate": "20260314",
    "StudyTime": "141530",
}

INSTANCE_NUMBERS = [3, 1, 10, 2]
BURNED_IN_DESCRIPTION = "BURNED IN PHI TEST"


def _legible_font(size: int):
    """A font big enough to OCR.

    Pillow's bitmap default is ~11px and reads poorly — tesseract misread
    "4820193" as "4820103" at that size. `load_default(size=)` needs Pillow
    >= 10.1, which the system interpreter may not have, so try a real
    TrueType face first.
    """
    from PIL import ImageFont

    for path in (
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ):
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                pass
    try:
        return ImageFont.load_default(size=size)   # Pillow >= 10.1
    except TypeError:
        return ImageFont.load_default()            # last resort, small


def burned_in_pixels(width: int, height: int) -> "np.ndarray":
    """Render identifiers INTO the pixels, the way an ultrasound or a scanned
    film does. This is the PHI header de-identification cannot reach, and the
    only fixture that exercises /phi-scan meaningfully — the other study
    declares BurnedInAnnotation=YES over a gradient, which proves nothing."""
    from PIL import Image, ImageDraw, ImageFont

    img = Image.new("L", (width, height), 0)
    d = ImageDraw.Draw(img)
    # A body-ish blob so the frame is not pure text.
    d.ellipse([width * 0.2, height * 0.25, width * 0.8, height * 0.9], fill=90)
    font = _legible_font(26)
    for i, line in enumerate(("PATIENT DOE^JANE", "MRN 4820193", "03/14/2026")):
        d.text((14, 12 + i * 32), line, fill=255, font=font)
    return (np.asarray(img).astype(np.uint16)) * 16


def main(outdir: str) -> int:
    os.makedirs(outdir, exist_ok=True)
    study_uid, series_uid = generate_uid(), generate_uid()

    for n in INSTANCE_NUMBERS:
        fm = FileMetaDataset()
        fm.MediaStorageSOPClassUID = CTImageStorage
        fm.MediaStorageSOPInstanceUID = generate_uid()
        fm.TransferSyntaxUID = ExplicitVRLittleEndian

        ds = FileDataset(f"{n}.dcm", {}, file_meta=fm, preamble=b"\0" * 128)
        for tag, value in PHI.items():
            setattr(ds, tag, value)

        ds.SOPClassUID = CTImageStorage
        ds.SOPInstanceUID = fm.MediaStorageSOPInstanceUID
        ds.StudyInstanceUID, ds.SeriesInstanceUID = study_uid, series_uid
        ds.StudyDescription, ds.SeriesDescription = "CT CHEST", "AXIAL"
        ds.Modality, ds.SeriesNumber, ds.InstanceNumber = "CT", 2, n
        ds.Rows = ds.Columns = 64
        ds.PixelSpacing = [0.7, 0.7]
        ds.SliceThickness = 1.25
        ds.SliceLocation = float(n)
        ds.ImagePositionPatient = [0.0, 0.0, float(n)]
        ds.ImageOrientationPatient = [1, 0, 0, 0, 1, 0]
        ds.WindowCenter, ds.WindowWidth = 40, 400
        ds.RescaleSlope, ds.RescaleIntercept = 1, -1024
        ds.BitsAllocated = ds.BitsStored = 16
        ds.HighBit = 15
        ds.PixelRepresentation = 0
        ds.SamplesPerPixel = 1
        ds.PhotometricInterpretation = "MONOCHROME2"
        # Retained by the allowlist on purpose: burned-in pixel text is PHI no
        # header can hide, and the client flags it.
        ds.BurnedInAnnotation = "YES"
        ds.PixelData = (np.arange(64 * 64, dtype=np.uint16) % 1000).tobytes()

        ds.save_as(os.path.join(outdir, f"{n}.dcm"), write_like_original=False)

    # A second, single-instance study whose identifiers live in the pixels.
    fm = FileMetaDataset()
    fm.MediaStorageSOPClassUID = CTImageStorage
    fm.MediaStorageSOPInstanceUID = generate_uid()
    fm.TransferSyntaxUID = ExplicitVRLittleEndian
    ds = FileDataset("burned.dcm", {}, file_meta=fm, preamble=b"\0" * 128)
    for tag, value in PHI.items():
        setattr(ds, tag, value)
    ds.SOPClassUID = CTImageStorage
    ds.SOPInstanceUID = fm.MediaStorageSOPInstanceUID
    ds.StudyInstanceUID, ds.SeriesInstanceUID = generate_uid(), generate_uid()
    ds.StudyDescription, ds.SeriesDescription = BURNED_IN_DESCRIPTION, "BURNED IN"
    ds.Modality, ds.SeriesNumber, ds.InstanceNumber = "CT", 1, 1
    ds.Rows = ds.Columns = 512
    ds.PixelSpacing = [0.5, 0.5]
    ds.WindowCenter, ds.WindowWidth = 2048, 4096
    ds.BitsAllocated = ds.BitsStored = 16
    ds.HighBit = 15
    ds.PixelRepresentation = 0
    ds.SamplesPerPixel = 1
    ds.PhotometricInterpretation = "MONOCHROME2"
    # Deliberately NOT set: equipment often omits it, which is the case the
    # pixel scan exists for.
    ds.PixelData = burned_in_pixels(512, 512).tobytes()
    ds.save_as(os.path.join(outdir, "burned.dcm"), write_like_original=False)

    print(f"wrote {len(INSTANCE_NUMBERS) + 1} instances to {outdir}")
    print("upload with:")
    print(f'  for f in {outdir}/*.dcm; do curl -s -X POST "$ORTHANC_URL/instances" \\')
    print('    --data-binary @"$f" -H "Content-Type: application/dicom" >/dev/null; done')
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "/tmp/dicom-fixtures"))
