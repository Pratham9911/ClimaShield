def analyze_diseases(disaster_preds, limit=5):
    BUCKETS = [(40,60),(61,70),(71,80),(81,90),(91,100)]
    THRESHOLD = BUCKETS[0][0]

    # your existing matrix here
    DISASTER_DISEASE_MATRIX = {

  "Heatwave": {
    "Dehydration":               [1,2,3,3,3],
    "Heat_exhaustion":           [0,1,2,3,3],
    "Heat_stroke_hyperthermia":  [0,0,1,2,3],
    "Electrolyte_imbalance":     [0,1,2,3,3],
    "Heat_cramps":               [0,1,2,2,3],
    "Heat_rash_miliaria":        [1,1,1,1,2],
    "Sunburn_UV_injury":         [0,0,1,2,3],
    "Acute_kidney_stress_AKI":   [0,0,1,2,3],
    "Syncope_fainting":          [0,1,2,2,3],
    "Cardiac_stress_arrhythmia": [0,0,1,2,3],
    "Asthma_exacerbation_heat":  [0,1,1,2,2],
    "Migraine_headache":         [1,1,2,2,3],
    "Eye_irritation_photokeratitis":[0,0,1,2,3]
  },

  "AirPollution": {
    "Asthma_exacerbation":       [1,2,3,3,3],
    "COPD_exacerbation":         [1,2,3,3,3],
    "Acute_bronchitis":          [0,1,2,2,3],
    "Shortness_of_breath":       [1,2,3,3,3],
    "Cough_sore_throat":         [1,1,2,2,2],
    "Lung_inflammation_reduced_function":[0,1,2,2,3],
    "Cardiovascular_event_trigger":[0,1,2,3,3],
    "Allergic_rhinitis":         [1,1,2,2,2],
    "Eye_irritation_conjunctivitis":[1,1,1,2,2],
    "Headache_fatigue":          [1,1,2,2,3]
  },

  "Flood": {
    "Leptospirosis":             [0,0,1,2,3],
    "Diarrheal_disease":         [0,1,2,3,3],
    "Gastroenteritis_foodborne": [0,1,2,3,3],
    "Cholera_if_endemic":        [0,0,1,2,3],
    "Typhoid":                   [0,0,1,2,3],
    "Skin_infections_cellulitis": [0,1,2,2,3],
    "Mosquito_borne_increase_dengue_malaria":[0,1,2,3,3],
    "Eye_infections":            [0,1,1,2,2],
    "Ear_infections":            [0,1,1,2,2],
    "Wound_infections_from_contam":[0,1,2,3,3],
    "Mental_health_acute_stress": [0,1,2,2,3]
  },

  "ColdWave": {
    "Hypothermia":               [0,0,1,2,3],
    "Frostbite":                 [0,0,0,1,2],
    "Cold_related_respiratory_infection":[0,1,2,2,3],
    "Cardiovascular_exacerbation": [0,1,2,3,3],
    "Asthma_COPD_cold_trigger":  [0,1,2,2,3],
    "Arthritis_joint_pain_flare": [0,1,1,2,2],
    "Syncope_or_falls_from_hypothermia":[0,0,1,2,2]
  },

  "Storm": {
    "Trauma_injuries_blunt":     [0,1,2,3,3],
    "Lacerations_puncture_wounds":[0,1,2,3,3],
    "Electrical_injury":         [0,0,1,2,3],
    "Floodborne_infections_overlap":[0,1,2,3,3],
    "Skin_infections_postinjury": [0,1,2,2,3],
    "Gastrointestinal_contamination":[0,1,2,2,3],
    "Vector_borne_surge":        [0,1,2,3,3],
    "Mental_health_post_storm":  [0,1,2,2,3],
    "Hypothermia_if_cold_storm": [0,0,1,2,3],
    "Respiratory_irritation_debris_dust":[0,1,1,2,2]
  },

  "Drought": {
    "Dehydration_chronic":       [0,1,2,3,3],
    "Malnutrition_food_insecurity":[0,0,1,2,3],
    "Dust_related_respiratory_issues":[0,1,2,2,3],
    "Water_scarcity_GI_risk":    [0,0,1,2,3],
    "Vector_ecology_shift":      [0,0,1,1,2],
    "Heat_overlap_effects":      [0,0,1,2,3]  # generic overlap placeholder
  },

  "Fog": {
    "Asthma_COPD_exacerbation_fog":[0,1,1,2,2],
    "Bronchitis_cough":          [0,1,1,2,2],
    "Upper_respiratory_irritation":[0,1,1,2,2],
    "Eye_irritation":            [0,1,1,1,2],
    "Anxiety_stress_visibility": [0,1,1,1,2],
    "Road_traffic_injury_low_visibility":[0,1,2,2,3]  # included as clinical-impact (injuries)
  }

}


    disease_scores = {}

    # ------------------------------------
    # 1. Loop through disasters
    # ------------------------------------
    for disaster, value in disaster_preds.items():

        if value < THRESHOLD:
            continue

        # Find bucket index
        bucket_idx = None
        for i, (lo, hi) in enumerate(BUCKETS):
            if lo <= value <= hi:
                bucket_idx = i
                break
        if bucket_idx is None:
            if value > BUCKETS[-1][1]:
                bucket_idx = len(BUCKETS) - 1
            else:
                continue

        if disaster not in DISASTER_DISEASE_MATRIX:
            continue

        disease_map = DISASTER_DISEASE_MATRIX[disaster]

        # ------------------------------------
        # 2. Select severity directly from matrix
        # ------------------------------------
        for disease, arr in disease_map.items():

            severity = arr[bucket_idx]  # 0–3

            if severity <= 0:
                continue  # skip 0 severity

            # If disease already added, keep maximum severity
            if disease in disease_scores:
                disease_scores[disease] = max(disease_scores[disease], severity)
            else:
                disease_scores[disease] = severity

    # ------------------------------------
    # 3. Sort diseases by severity
    # ------------------------------------
    sorted_diseases = dict(
        sorted(disease_scores.items(), key=lambda x: x[1], reverse=True)
    )

    # ------------------------------------
    # 4. Apply LIMIT
    # ------------------------------------
    if limit > 0:
        limited = dict(list(sorted_diseases.items())[:limit])
    else:
        limited = sorted_diseases  # return all

    return {
        "disease_predictions": limited
    }
