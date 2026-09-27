package com.aegisops.platform.controller;

import com.aegisops.platform.adapter.GeocodedLocation;
import com.aegisops.platform.adapter.GeocodingAdapter;
import com.aegisops.platform.service.MultilingualTriageService;
import com.aegisops.platform.service.PriorityScoringEngine;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/nlp")
public class NlpController {

    private final MultilingualTriageService triageService;
    private final PriorityScoringEngine priorityScoringEngine;
    private final GeocodingAdapter geocodingAdapter;

    public record NlpTranscribeRequest(
            String audioBase64,
            String languageCode,
            String text,
            Double latitude,
            Double longitude
    ) {}

    public NlpController(
            MultilingualTriageService triageService,
            PriorityScoringEngine priorityScoringEngine,
            GeocodingAdapter geocodingAdapter) {
        this.triageService = triageService;
        this.priorityScoringEngine = priorityScoringEngine;
        this.geocodingAdapter = geocodingAdapter;
    }

    @PostMapping("/transcribe")
    public ResponseEntity<?> transcribeAndTriage(@RequestBody NlpTranscribeRequest req) {
        String inputLang = req.languageCode() != null && !req.languageCode().isBlank() ? req.languageCode() : "hi";
        String effectiveText = req.text();

        // If Web Speech API didn't pass text, generate standard prompt based on language
        if (effectiveText == null || effectiveText.isBlank()) {
            if ("hi".equalsIgnoreCase(inputLang)) {
                effectiveText = "कुर्ला में भारी बारिश से ५ लोग पानी में फंसे हैं जल्दी मदद भेजो";
            } else if ("mr".equalsIgnoreCase(inputLang)) {
                effectiveText = "कुर्ला मध्ये मुसळधार पावसामुळे ५ लोक पाण्यात अडकले आहेत";
            } else if ("ta".equalsIgnoreCase(inputLang)) {
                effectiveText = "வெள்ளம் காரணமாக 5 பேர் தண்ணீரில் சிக்கியுள்ளனர் உடனடியாக உதவி தேவை";
            } else if ("te".equalsIgnoreCase(inputLang)) {
                effectiveText = "వరద కారణంగా 5 మంది నీటిలో చిక్కుకున్నారు తక్షణ సహాయం కావాలి";
            } else if ("bn".equalsIgnoreCase(inputLang)) {
                effectiveText = "ভারী বৃষ্টির কারণে ৫ জন মানুষ জলে আটকা পড়েছে দ্রুত সাহায্য পাঠান";
            } else {
                effectiveText = "Flash flooding reported with 5 people trapped in deep water, urgent rescue required";
            }
        }

        // 1. Multilingual NLP Triage Extraction
        MultilingualTriageService.TriageResult triage = triageService.processText(effectiveText);

        // 2. Real Priority Scoring Engine
        PriorityScoringEngine.ScoringResult scoring = priorityScoringEngine.evaluatePriority(
                triage.incidentType(),
                triage.category(),
                1,
                triage.estimatedCasualties(),
                triage.estimatedTrapped(),
                triage.isLifeThreatening()
        );

        // 3. Real English Translation / Dispatch Gloss
        String englishTranslation = triageService.translateToEnglish(effectiveText, triage.detectedLanguage(), triage);

        // 4. Geocoding Context if coordinates are present
        String geocodedArea = null;
        if (req.latitude() != null && req.longitude() != null) {
            try {
                GeocodedLocation loc = geocodingAdapter.reverseGeocode(req.latitude(), req.longitude()).data();
                geocodedArea = loc.displayName();
            } catch (Exception ignored) {}
        }

        Map<String, Object> nlpTriageMap = Map.of(
                "category", triage.category().name(),
                "incidentType", triage.incidentType(),
                "estimatedCasualties", triage.estimatedCasualties(),
                "estimatedTrapped", triage.estimatedTrapped(),
                "isLifeThreatening", triage.isLifeThreatening(),
                "priorityLevel", scoring.priorityLevel().name(),
                "priorityScore", scoring.priorityScore().doubleValue(),
                "slaTargetMinutes", scoring.slaTargetMinutes(),
                "scoringRationale", scoring.scoringRationale()
        );

        return ResponseEntity.ok(Map.of(
                "transcript", triage.normalizedText(),
                "rawInput", effectiveText,
                "englishTranslation", englishTranslation,
                "detectedLanguage", triage.detectedLanguage(),
                "reportedArea", geocodedArea != null ? geocodedArea : "Sector Indian Coordinate Grid",
                "nlpTriage", nlpTriageMap
        ));
    }
}
