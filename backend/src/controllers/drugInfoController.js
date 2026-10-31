const { VERIFIED_DRUG_DATABASE, searchDrugs } = require('../data/verifiedDrugs');

async function getDrugInformation(req, res, next) {
  try {
    const { query: searchQuery } = req.query;
    const data = await searchDrugs(searchQuery);

    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (err) {
    next(err);
  }
}

async function getDrugById(req, res, next) {
  try {
    const { id } = req.params;
    const found = VERIFIED_DRUG_DATABASE.find(d => d.id === id);

    if (!found) {
      return res.status(404).json({
        success: false,
        message: 'Drug reference entry not found in verified database.',
      });
    }

    return res.status(200).json({
      success: true,
      drug: found,
      disclaimer: 'MediSync is an informational medication reminder system, not a prescribing or clinical consultation engine.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDrugInformation,
  getDrugById,
};

