-- Adds a partial unique index on barcode so barcode-only works (no accession
-- number) can't be inserted twice. Partial means NULL barcodes are excluded —
-- a work with no barcode won't conflict with another work with no barcode.
CREATE UNIQUE INDEX IF NOT EXISTS works_barcode_unique
  ON public.works(barcode)
  WHERE barcode IS NOT NULL;
