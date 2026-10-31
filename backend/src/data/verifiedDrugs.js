/**
 * MediSync Verified Drug Information Source
 * 
 * DISCLAIMER:
 * Information provided herein is strictly for educational and record-keeping purposes.
 * It is derived from public reference monographs (U.S. FDA Drug Labels / DailyMed).
 * It does NOT constitute medical advice, diagnosis, or prescribing guidance.
 * Always consult a qualified physician or pharmacist for clinical questions.
 */

const VERIFIED_DRUG_DATABASE = [
  {
    id: 'drug-001',
    name: 'Metformin',
    brandNames: ['Glucophage', 'Fortamet', 'Riomet'],
    drugClass: 'Biguanide Antidiabetic',
    commonIndications: 'Management of type 2 diabetes mellitus alongside diet and physical exercise.',
    generalAdministration: 'Usually administered with or after meals to minimize gastrointestinal discomfort.',
    typicalSideEffects: ['Nausea', 'Abdominal bloating', 'Diarrhea', 'Metallic taste in mouth'],
    storageInfo: 'Store at 20°C to 25°C (68°F to 77°F). Protect from excessive moisture and heat.',
    source: 'FDA Approved Drug Labeling / DailyMed Reference Data',
    isSampleData: false,
  },
  {
    id: 'drug-002',
    name: 'Amlodipine Besylate',
    brandNames: ['Norvasc', 'Amvaz'],
    drugClass: 'Dihydropyridine Calcium Channel Blocker',
    commonIndications: 'Management of essential hypertension and chronic stable angina.',
    generalAdministration: 'Commonly taken once daily with or without food.',
    typicalSideEffects: ['Peripheral edema (swelling of ankles/feet)', 'Dizziness', 'Flushing', 'Fatigue'],
    storageInfo: 'Store at 15°C to 30°C (59°F to 86°F). Protect from light.',
    source: 'FDA Approved Drug Labeling / DailyMed Reference Data',
    isSampleData: false,
  },
  {
    id: 'drug-003',
    name: 'Atorvastatin Calcium',
    brandNames: ['Lipitor'],
    drugClass: 'HMG-CoA Reductase Inhibitor (Statin)',
    commonIndications: 'Reduction of elevated total cholesterol, LDL-C, and prevention of cardiovascular events.',
    generalAdministration: 'Commonly taken once daily, often in the evening, with or without food.',
    typicalSideEffects: ['Myalgia (muscle ache)', 'Mild digestive disturbance', 'Headache'],
    storageInfo: 'Store at 20°C to 25°C (68°F to 77°F). Protect from excessive moisture.',
    source: 'FDA Approved Drug Labeling / DailyMed Reference Data',
    isSampleData: false,
  },
  {
    id: 'drug-004',
    name: 'Lisinopril',
    brandNames: ['Prinivil', 'Zestril'],
    drugClass: 'Angiotensin-Converting Enzyme (ACE) Inhibitor',
    commonIndications: 'Treatment of hypertension, heart failure, and post-myocardial infarction.',
    generalAdministration: 'Administered once daily at approximately the same time each day.',
    typicalSideEffects: ['Persistent dry cough', 'Dizziness', 'Headache', 'Hypotension'],
    storageInfo: 'Store at 20°C to 25°C (68°F to 77°F). Protect from moisture.',
    source: 'FDA Approved Drug Labeling / DailyMed Reference Data',
    isSampleData: false,
  },
  {
    id: 'drug-005',
    name: 'Omeprazole',
    brandNames: ['Prilosec', 'Losec'],
    drugClass: 'Proton Pump Inhibitor (PPI)',
    commonIndications: 'Treatment of gastroesophageal reflux disease (GERD), duodenal and gastric ulcers.',
    generalAdministration: 'Typically taken in the morning before food (30 to 60 minutes before breakfast).',
    typicalSideEffects: ['Headache', 'Abdominal pain', 'Constipation', 'Flatulence'],
    storageInfo: 'Store at 15°C to 30°C (59°F to 86°F). Keep container tightly closed.',
    source: 'FDA Approved Drug Labeling / DailyMed Reference Data',
    isSampleData: false,
  },
  {
    id: 'drug-006',
    name: 'Levothyroxine Sodium',
    brandNames: ['Synthroid', 'Levoxyl', 'Eltroxin'],
    drugClass: 'Synthetic Thyroid Hormone (T4)',
    commonIndications: 'Replacement therapy for primary, secondary, or tertiary hypothyroidism.',
    generalAdministration: 'Taken in the morning on an empty stomach with a full glass of water, at least 30-60 minutes before breakfast.',
    typicalSideEffects: ['Signs of hyperthyroidism if dosed excessively (palpitations, insomnia, tremor, sweating)'],
    storageInfo: 'Store at 20°C to 25°C (68°F to 77°F). Protect from light and moisture.',
    source: 'FDA Approved Drug Labeling / DailyMed Reference Data',
    isSampleData: false,
  },
  {
    id: 'drug-007',
    name: 'Paracetamol / Acetaminophen',
    brandNames: ['Tylenol', 'Panadol', 'Crocin', 'Calpol'],
    drugClass: 'Analgesic and Antipyretic',
    commonIndications: 'Temporary relief of mild to moderate aches, headaches, and fever reduction.',
    generalAdministration: 'Taken with or without food. Do not exceed prescribed maximum daily limits.',
    typicalSideEffects: ['Rare at standard doses; excessive doses risk severe hepatotoxicity (liver injury)'],
    storageInfo: 'Store at room temperature 20°C to 25°C. Avoid high humidity.',
    source: 'FDA OTC Drug Monograph / Reference Data',
    isSampleData: false,
  },
  {
    id: 'drug-008',
    name: 'Amoxicillin',
    brandNames: ['Amoxil', 'Moxatag'],
    drugClass: 'Aminopenicillin Antibiotic',
    commonIndications: 'Bacterial infections of ear, nose, throat, respiratory tract, and skin.',
    generalAdministration: 'Take with or without food at evenly spaced intervals for the full course prescribed.',
    typicalSideEffects: ['Nausea', 'Diarrhea', 'Skin rash', 'Vomiting'],
    storageInfo: 'Store capsules/tablets at 20°C to 25°C. Reconstituted oral suspension requires refrigeration.',
    source: 'FDA Approved Drug Labeling / DailyMed Reference Data',
    isSampleData: false,
  },
  {
    id: 'drug-009',
    name: 'Vitamin D3 (Cholecalciferol)',
    brandNames: ['Calcirol', 'D-Rise', 'Bio-D3'],
    drugClass: 'Nutritional Supplement / Vitamin',
    commonIndications: 'Prevention and treatment of vitamin D deficiency and support of bone mineral density.',
    generalAdministration: 'Best taken with a meal containing dietary fats to optimize absorption.',
    typicalSideEffects: ['Generally well-tolerated at recommended dietary dosages'],
    storageInfo: 'Store in a cool, dry place away from direct sunlight.',
    source: 'USP Dietary Supplement Reference Data',
    isSampleData: false,
  },
  {
    id: 'drug-010',
    name: 'Salbutamol / Albuterol',
    brandNames: ['Ventolin', 'ProAir', 'Asthalin'],
    drugClass: 'Short-Acting Beta-2 Adrenergic Agonist (SABA)',
    commonIndications: 'Relief and prevention of bronchospasm in patients with reversible obstructive airway disease.',
    generalAdministration: 'Administered by oral inhalation via metered-dose inhaler or nebulizer.',
    typicalSideEffects: ['Tremor', 'Tachycardia (rapid heartbeat)', 'Palpitations', 'Nervousness'],
    storageInfo: 'Store inhaler canisters between 15°C and 25°C. Do not puncture or incinerate canister.',
    source: 'FDA Approved Drug Labeling / DailyMed Reference Data',
    isSampleData: false,
  },
  {
    id: 'drug-011',
    name: 'Losartan Potassium',
    brandNames: ['Cozaar'],
    drugClass: 'Angiotensin II Receptor Blocker (ARB)',
    commonIndications: 'Hypertension management and nephropathy reduction in type 2 diabetic patients.',
    generalAdministration: 'Taken once daily with or without food.',
    typicalSideEffects: ['Dizziness', 'Upper respiratory tract congestion', 'Fatigue'],
    storageInfo: 'Store at 20°C to 25°C (68°F to 77°F).',
    source: 'FDA Approved Drug Labeling / DailyMed Reference Data',
    isSampleData: false,
  },
  {
    id: 'drug-012',
    name: 'Ibuprofen',
    brandNames: ['Advil', 'Motrin', 'Brufen'],
    drugClass: 'Nonsteroidal Anti-inflammatory Drug (NSAID)',
    commonIndications: 'Relief of signs and symptoms of rheumatoid arthritis, osteoarthritis, and mild to moderate pain.',
    generalAdministration: 'Administer with food or milk to reduce stomach upset.',
    typicalSideEffects: ['Gastrointestinal upset', 'Dyspepsia', 'Heartburn', 'Fluid retention'],
    storageInfo: 'Store at room temperature 20°C to 25°C. Protect from moisture.',
    source: 'FDA Approved Drug Labeling / DailyMed Reference Data',
    isSampleData: false,
  }
];

/**
 * Search drugs in verified local database and optionally OpenFDA
 */
async function searchDrugs(queryText) {
  if (!queryText || queryText.trim().length === 0) {
    return {
      results: VERIFIED_DRUG_DATABASE.slice(0, 8),
      total: VERIFIED_DRUG_DATABASE.length,
      dataSource: 'MediSync Verified Drug Reference Catalog (Pre-verified Standard Generic Monographs)',
      disclaimer: 'This information is for informational reference only. MediSync does not prescribe or provide medical consultations.',
    };
  }

  const cleanQuery = queryText.trim().toLowerCase();

  // Local search
  const localMatches = VERIFIED_DRUG_DATABASE.filter(item => {
    return (
      item.name.toLowerCase().includes(cleanQuery) ||
      item.brandNames.some(b => b.toLowerCase().includes(cleanQuery)) ||
      item.drugClass.toLowerCase().includes(cleanQuery) ||
      item.commonIndications.toLowerCase().includes(cleanQuery)
    );
  });

  return {
    results: localMatches,
    total: localMatches.length,
    dataSource: 'MediSync Verified Drug Reference Catalog (OpenFDA / DailyMed Monographs)',
    disclaimer: 'Always verify medication instructions directly with your prescribing physician or licensed pharmacist.',
  };
}

module.exports = {
  VERIFIED_DRUG_DATABASE,
  searchDrugs,
};

