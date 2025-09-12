-- Add language column to residents table
ALTER TABLE residents ADD COLUMN IF NOT EXISTS language VARCHAR(50);

-- Add index for language column for better query performance
CREATE INDEX IF NOT EXISTS idx_residents_language ON residents(language);

-- Add comment to document the column purpose
COMMENT ON COLUMN residents.language IS 'Auto-filled language based on nationality for document generation';

-- Update existing residents with language based on nationality if possible
-- This is a basic mapping - you can expand this as needed
UPDATE residents SET language = CASE 
    WHEN nationality ILIKE '%nederland%' OR nationality ILIKE '%dutch%' OR nationality ILIKE '%holland%' THEN 'Nederlands'
    WHEN nationality ILIKE '%belg%' OR nationality ILIKE '%belgium%' THEN 'Nederlands'
    WHEN nationality ILIKE '%france%' OR nationality ILIKE '%french%' OR nationality ILIKE '%français%' THEN 'Français'
    WHEN nationality ILIKE '%germany%' OR nationality ILIKE '%german%' OR nationality ILIKE '%deutsch%' THEN 'Deutsch'
    WHEN nationality ILIKE '%spain%' OR nationality ILIKE '%spanish%' OR nationality ILIKE '%español%' THEN 'Español'
    WHEN nationality ILIKE '%italy%' OR nationality ILIKE '%italian%' OR nationality ILIKE '%italiano%' THEN 'Italiano'
    WHEN nationality ILIKE '%portugal%' OR nationality ILIKE '%portuguese%' OR nationality ILIKE '%português%' THEN 'Português'
    WHEN nationality ILIKE '%poland%' OR nationality ILIKE '%polish%' OR nationality ILIKE '%polski%' THEN 'Polski'
    WHEN nationality ILIKE '%romania%' OR nationality ILIKE '%romanian%' OR nationality ILIKE '%română%' THEN 'Română'
    WHEN nationality ILIKE '%bulgaria%' OR nationality ILIKE '%bulgarian%' OR nationality ILIKE '%български%' THEN 'Български'
    WHEN nationality ILIKE '%hungary%' OR nationality ILIKE '%hungarian%' OR nationality ILIKE '%magyar%' THEN 'Magyar'
    WHEN nationality ILIKE '%czech%' OR nationality ILIKE '%čeština%' THEN 'Čeština'
    WHEN nationality ILIKE '%slovak%' OR nationality ILIKE '%slovenčina%' THEN 'Slovenčina'
    WHEN nationality ILIKE '%slovenia%' OR nationality ILIKE '%slovenščina%' THEN 'Slovenščina'
    WHEN nationality ILIKE '%croatia%' OR nationality ILIKE '%croatian%' OR nationality ILIKE '%hrvatski%' THEN 'Hrvatski'
    WHEN nationality ILIKE '%serbia%' OR nationality ILIKE '%serbian%' OR nationality ILIKE '%srpski%' THEN 'Srpski'
    WHEN nationality ILIKE '%albania%' OR nationality ILIKE '%albanian%' OR nationality ILIKE '%shqip%' THEN 'Shqip'
    WHEN nationality ILIKE '%greece%' OR nationality ILIKE '%greek%' OR nationality ILIKE '%ελληνικά%' THEN 'Ελληνικά'
    WHEN nationality ILIKE '%turkey%' OR nationality ILIKE '%turkish%' OR nationality ILIKE '%türkçe%' THEN 'Türkçe'
    WHEN nationality ILIKE '%russia%' OR nationality ILIKE '%russian%' OR nationality ILIKE '%русский%' THEN 'Русский'
    WHEN nationality ILIKE '%ukraine%' OR nationality ILIKE '%ukrainian%' OR nationality ILIKE '%українська%' THEN 'Українська'
    WHEN nationality ILIKE '%arab%' OR nationality ILIKE '%syria%' OR nationality ILIKE '%lebanon%' OR nationality ILIKE '%iraq%' OR nationality ILIKE '%jordan%' THEN 'العربية'
    WHEN nationality ILIKE '%afghanistan%' OR nationality ILIKE '%dari%' OR nationality ILIKE '%pashto%' THEN 'دری'
    WHEN nationality ILIKE '%iran%' OR nationality ILIKE '%persian%' OR nationality ILIKE '%farsi%' THEN 'فارسی'
    WHEN nationality ILIKE '%somalia%' OR nationality ILIKE '%somali%' THEN 'Soomaali'
    WHEN nationality ILIKE '%eritrea%' OR nationality ILIKE '%tigrinya%' THEN 'ትግርኛ'
    WHEN nationality ILIKE '%ethiopia%' OR nationality ILIKE '%amharic%' THEN 'አማርኛ'
    WHEN nationality ILIKE '%india%' OR nationality ILIKE '%hindi%' THEN 'हिन्दी'
    WHEN nationality ILIKE '%pakistan%' OR nationality ILIKE '%urdu%' THEN 'اردو'
    WHEN nationality ILIKE '%bangladesh%' OR nationality ILIKE '%bengali%' THEN 'বাংলা'
    WHEN nationality ILIKE '%china%' OR nationality ILIKE '%chinese%' THEN '中文'
    WHEN nationality ILIKE '%vietnam%' OR nationality ILIKE '%vietnamese%' THEN 'Tiếng Việt'
    WHEN nationality ILIKE '%thailand%' OR nationality ILIKE '%thai%' THEN 'ไทย'
    WHEN nationality ILIKE '%myanmar%' OR nationality ILIKE '%burmese%' THEN 'မြန်မာ'
    WHEN nationality ILIKE '%tibet%' OR nationality ILIKE '%tibetan%' THEN 'བོད་ཡིག'
    WHEN nationality ILIKE '%english%' OR nationality ILIKE '%uk%' OR nationality ILIKE '%britain%' OR nationality ILIKE '%usa%' OR nationality ILIKE '%america%' OR nationality ILIKE '%australia%' OR nationality ILIKE '%canada%' OR nationality ILIKE '%ireland%' OR nationality ILIKE '%south africa%' THEN 'English'
    ELSE 'Nederlands' -- Default to Dutch for unknown nationalities
END
WHERE language IS NULL AND nationality IS NOT NULL AND nationality != '';

-- Log the update
INSERT INTO activity_logs (action, entity_type, details) 
VALUES ('migration', 'residents', '{"migration": "007_add_language_column", "description": "Added language column and auto-filled based on nationality"}');
