const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const MEDICATION_FORMS = [
  'COMPRIMIDO', 'CAPSULA', 'LIQUIDO', 'POMADA',
  'INJETAVEL', 'GOTAS', 'SPRAY', 'ADESIVO', 'OUTRO',
];

const EFFICACY_VALUES = ['EFICAZ', 'PARCIAL', 'INEFICAZ'];

const UPLOAD_TYPES = {
  PRESCRIPTION: 'prescription',
  EXAM: 'exam',
};

const UPLOAD_TYPE_VALUES = Object.values(UPLOAD_TYPES);

module.exports = {
  BLOOD_TYPES,
  MEDICATION_FORMS,
  EFFICACY_VALUES,
  UPLOAD_TYPES,
  UPLOAD_TYPE_VALUES,
};
