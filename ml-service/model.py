def _match_score(symptoms, keywords):
    """Count keyword hits with normalized symptom strings."""
    score = 0
    for sym in symptoms:
        for kw in keywords:
            if kw in sym or sym in kw:
                score += 1
                break
    return score


def _confidence_from_score(score, max_keywords):
    if max_keywords == 0:
        return "50%"
    ratio = min(score / max_keywords, 1.0)
    pct = int(50 + ratio * 45)
    return f"{pct}%"


def predict_disease(symptoms):
    """
    Prototype symptom-matching assistant (rules engine).
    Not a trained clinical model — for demonstration and decision support only.
    """

    knowledge_base = [
        {
            "disease": "Influenza (Flu)",
            "keywords": ["fever", "cough", "headache", "fatigue", "muscle pain"],
            "severity": "Medium",
            "specialistSuggested": "General Physician",
            "precautions": [
                "Drink plenty of fluids",
                "Get adequate rest",
                "Take prescribed antivirals if early",
            ],
        },
        {
            "disease": "COVID-19",
            "keywords": ["fever", "cough", "loss of taste", "loss of smell", "shortness of breath"],
            "severity": "High",
            "specialistSuggested": "Pulmonologist / General Physician",
            "precautions": [
                "Isolate immediately",
                "Wear an N95 mask",
                "Monitor blood oxygen levels",
                "Seek emergency care if breathing is difficult",
            ],
        },
        {
            "disease": "Dengue Fever",
            "keywords": ["high fever", "severe headache", "joint pain", "rash", "nausea", "fever"],
            "severity": "High",
            "specialistSuggested": "Infectious Disease Specialist",
            "precautions": [
                "Drink ORS and juices",
                "Take Paracetamol for fever",
                "Avoid Aspirin or Ibuprofen",
                "Monitor platelet count",
            ],
        },
        {
            "disease": "Migraine",
            "keywords": ["headache", "nausea", "sensitivity to light", "blurred vision"],
            "severity": "Medium",
            "specialistSuggested": "Neurologist",
            "precautions": [
                "Rest in a quiet, dark room",
                "Place an ice pack on your forehead",
                "Stay hydrated",
            ],
        },
        {
            "disease": "Gastroenteritis (Stomach Flu)",
            "keywords": ["vomiting", "diarrhea", "stomach pain", "nausea", "fever"],
            "severity": "Medium",
            "specialistSuggested": "Gastroenterologist",
            "precautions": [
                "Sip clear liquids",
                "Eat bland foods (BRAT diet)",
                "Get plenty of rest",
            ],
        },
    ]

    best_match = None
    highest_score = 0

    for entry in knowledge_base:
        score = _match_score(symptoms, entry["keywords"])
        if score > highest_score:
            highest_score = score
            best_match = entry

    if best_match is None or highest_score == 0:
        return {
            "disease": "General Viral Infection",
            "confidence": "55%",
            "severity": "Low",
            "specialistSuggested": "General Physician",
            "precautions": [
                "Monitor symptoms for 48 hours",
                "Stay hydrated",
                "Consult a doctor if symptoms worsen",
            ],
            "engine": "prototype-rules",
            "disclaimer": "Not medical advice. Consult a licensed professional.",
        }

    confidence = _confidence_from_score(highest_score, len(best_match["keywords"]))

    return {
        "disease": best_match["disease"],
        "confidence": confidence,
        "severity": best_match["severity"],
        "specialistSuggested": best_match["specialistSuggested"],
        "precautions": best_match["precautions"],
        "engine": "prototype-rules",
        "disclaimer": "Not medical advice. Consult a licensed professional.",
    }
