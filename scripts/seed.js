'use strict';

const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const FAMILY_ID = 'demo-familia-apresentacao';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const MEDICATION_FORMS = ['COMPRIMIDO', 'CAPSULA', 'LIQUIDO', 'POMADA', 'INJETAVEL', 'GOTAS', 'SPRAY', 'ADESIVO', 'OUTRO'];
const EFFICACY_VALUES = ['EFICAZ', 'PARCIAL', 'INEFICAZ'];

async function run() {
  const mongoUri = process.env.DB || 'mongodb://localhost:27017/nossasaudeDb';
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log('Conectado ao MongoDB:', mongoUri);

  const db = mongoose.connection.db;

  await db.collection('members').deleteMany({ familyId: FAMILY_ID });
  await db.collection('consultations').deleteMany({ familyId: FAMILY_ID });
  console.log('Dados anteriores removidos.');

  // --- Membros ---

  const anaId = randomUUID();
  const carlosId = randomUUID();
  const laraId = randomUUID();

  const now = new Date();

  const members = [
    {
      _id: anaId,
      familyId: FAMILY_ID,
      name: 'Ana Beatriz Melo',
      birthDate: new Date('1982-03-15'),
      bloodType: 'A+',
      weight: 68,
      height: 163,
      allergies: ['Dipirona', 'Penicilina'],
      chronicConditions: ['Hipertensão arterial', 'Enxaqueca crônica'],
      syncedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: carlosId,
      familyId: FAMILY_ID,
      name: 'Carlos Eduardo Melo',
      birthDate: new Date('1979-07-22'),
      bloodType: 'O+',
      weight: 88,
      height: 178,
      allergies: [],
      chronicConditions: ['Diabetes mellitus tipo 2', 'Dislipidemia'],
      syncedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: laraId,
      familyId: FAMILY_ID,
      name: 'Lara Melo',
      birthDate: new Date('2008-11-05'),
      bloodType: 'A+',
      weight: 54,
      height: 162,
      allergies: ['Ácaros', 'Pelo de gato'],
      chronicConditions: ['Asma brônquica leve persistente', 'Rinite alérgica'],
      syncedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  ];

  await db.collection('members').insertMany(members);
  console.log(`${members.length} membros inseridos.`);

  // --- Consultas ---

  const anaPrimeiraConsultaId = randomUUID();

  const consultations = [

    // ── ANA BEATRIZ ──────────────────────────────────────────────────────────

    {
      _id: anaPrimeiraConsultaId,
      familyId: FAMILY_ID,
      memberId: anaId,
      date: new Date('2025-09-10'),
      doctor: { name: 'Dra. Fernanda Rocha', specialty: 'Cardiologia', customSpecialty: null },
      clinic: 'Clínica Cardio Vida',
      reason: 'Acompanhamento da hipertensão',
      notes: 'PA 145/95 na chegada. Orientada sobre dieta hipossódica e atividade física regular. Retorno em 3 meses.',
      tags: ['hipertensão', 'cardiologia', 'acompanhamento'],
      returnOf: null,
      prescriptionImages: [],
      medications: [
        {
          name: 'Losartana Potássica',
          activeIngredient: 'Losartana',
          dosage: '50mg',
          form: 'COMPRIMIDO',
          frequency: '1x ao dia pela manhã',
          contraindicated: false,
          restrictionReason: null,
          efficacy: 'PARCIAL',
          sideEffects: 'Tonturas ocasionais ao levantar',
        },
        {
          name: 'Anlodipino',
          activeIngredient: 'Anlodipino besilato',
          dosage: '5mg',
          form: 'COMPRIMIDO',
          frequency: '1x ao dia à noite',
          contraindicated: false,
          restrictionReason: null,
          efficacy: null,
          sideEffects: null,
        },
      ],
      exams: [
        {
          _id: randomUUID(),
          name: 'Eletrocardiograma',
          notes: 'Ritmo sinusal, sem alterações significativas.',
          resultImages: [],
        },
        {
          _id: randomUUID(),
          name: 'Ecocardiograma',
          notes: 'Aguardando laudo. Exame realizado em 10/09/2025.',
          resultImages: [],
        },
      ],
      syncedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },

    {
      _id: randomUUID(),
      familyId: FAMILY_ID,
      memberId: anaId,
      date: new Date('2025-12-03'),
      doctor: { name: 'Dra. Fernanda Rocha', specialty: 'Cardiologia', customSpecialty: null },
      clinic: 'Clínica Cardio Vida',
      reason: 'Retorno — reavaliação da pressão arterial',
      notes: 'PA 132/84. Melhora com ajuste de medicação. Mantida Losartana 50mg + Anlodipino 5mg. Solicitar exames laboratoriais.',
      tags: ['hipertensão', 'cardiologia', 'retorno'],
      returnOf: anaPrimeiraConsultaId,
      prescriptionImages: [],
      medications: [
        {
          name: 'Losartana Potássica',
          activeIngredient: 'Losartana',
          dosage: '50mg',
          form: 'COMPRIMIDO',
          frequency: '1x ao dia pela manhã',
          contraindicated: false,
          restrictionReason: null,
          efficacy: 'EFICAZ',
          sideEffects: null,
        },
      ],
      exams: [
        {
          _id: randomUUID(),
          name: 'Hemograma completo',
          notes: 'Resultados dentro da normalidade.',
          resultImages: [],
        },
        {
          _id: randomUUID(),
          name: 'Creatinina e Ureia',
          notes: 'Função renal preservada. Creatinina 0,9 mg/dL.',
          resultImages: [],
        },
        {
          _id: randomUUID(),
          name: 'Sódio e Potássio',
          notes: 'Potássio 4,2 mEq/L. Normal.',
          resultImages: [],
        },
      ],
      syncedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },

    {
      _id: randomUUID(),
      familyId: FAMILY_ID,
      memberId: anaId,
      date: new Date('2026-02-18'),
      doctor: { name: 'Dra. Patrícia Lemos', specialty: 'Ginecologia e Obstetrícia', customSpecialty: null },
      clinic: 'Centro Médico da Mulher',
      reason: 'Consulta ginecológica de rotina',
      notes: 'Preventivo coletado. USG pélvica transvaginal solicitada. Suplementação de vitamina D recomendada.',
      tags: ['ginecologia', 'preventivo', 'rotina'],
      returnOf: null,
      prescriptionImages: [],
      medications: [
        {
          name: 'Vitamina D3',
          activeIngredient: 'Colecalciferol',
          dosage: '2000 UI',
          form: 'CAPSULA',
          frequency: '1x ao dia com a refeição',
          contraindicated: false,
          restrictionReason: null,
          efficacy: null,
          sideEffects: null,
        },
      ],
      exams: [
        {
          _id: randomUUID(),
          name: 'Papanicolau (Citologia cérvico-vaginal)',
          notes: 'Coletado em consulta. Resultado em 15 dias.',
          resultImages: [],
        },
        {
          _id: randomUUID(),
          name: 'USG Pélvica Transvaginal',
          notes: 'Útero e ovários de aspecto normal. Sem miomas.',
          resultImages: [],
        },
      ],
      syncedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },

    // ── CARLOS EDUARDO ────────────────────────────────────────────────────────

    {
      _id: randomUUID(),
      familyId: FAMILY_ID,
      memberId: carlosId,
      date: new Date('2025-08-05'),
      doctor: { name: 'Dr. Roberto Figueiredo', specialty: 'Endocrinologia', customSpecialty: null },
      clinic: 'Instituto de Endocrinologia e Diabetes',
      reason: 'Acompanhamento do diabetes e dislipidemia',
      notes: 'HbA1c 7,8%. Glicemia de jejum 142 mg/dL. Orientado sobre dieta low-carb e exercícios aeróbicos. Ajustada dose de Metformina.',
      tags: ['diabetes', 'endocrinologia', 'dislipidemia'],
      returnOf: null,
      prescriptionImages: [],
      medications: [
        {
          name: 'Metformina',
          activeIngredient: 'Cloridrato de metformina',
          dosage: '850mg',
          form: 'COMPRIMIDO',
          frequency: '2x ao dia (almoço e jantar)',
          contraindicated: false,
          restrictionReason: null,
          efficacy: 'PARCIAL',
          sideEffects: 'Desconforto gastrointestinal nos primeiros dias',
        },
        {
          name: 'Rosuvastatina',
          activeIngredient: 'Rosuvastatina cálcica',
          dosage: '10mg',
          form: 'COMPRIMIDO',
          frequency: '1x ao dia à noite',
          contraindicated: false,
          restrictionReason: null,
          efficacy: 'EFICAZ',
          sideEffects: null,
        },
      ],
      exams: [
        {
          _id: randomUUID(),
          name: 'Hemoglobina Glicada (HbA1c)',
          notes: '7,8% — acima da meta. Reavaliação em 3 meses.',
          resultImages: [],
        },
        {
          _id: randomUUID(),
          name: 'Glicemia de Jejum',
          notes: '142 mg/dL.',
          resultImages: [],
        },
        {
          _id: randomUUID(),
          name: 'Perfil Lipídico',
          notes: 'LDL 148 mg/dL, HDL 38 mg/dL, Triglicérides 210 mg/dL.',
          resultImages: [],
        },
      ],
      syncedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },

    {
      _id: randomUUID(),
      familyId: FAMILY_ID,
      memberId: carlosId,
      date: new Date('2025-11-20'),
      doctor: { name: 'Dr. Roberto Figueiredo', specialty: 'Endocrinologia', customSpecialty: null },
      clinic: 'Instituto de Endocrinologia e Diabetes',
      reason: 'Retorno — reavaliação do controle glicêmico',
      notes: 'HbA1c 7,1%. Boa evolução. Mantida medicação atual. Retorno em 6 meses.',
      tags: ['diabetes', 'endocrinologia', 'retorno'],
      returnOf: null,
      prescriptionImages: [],
      medications: [
        {
          name: 'Metformina',
          activeIngredient: 'Cloridrato de metformina',
          dosage: '850mg',
          form: 'COMPRIMIDO',
          frequency: '2x ao dia (almoço e jantar)',
          contraindicated: false,
          restrictionReason: null,
          efficacy: 'EFICAZ',
          sideEffects: null,
        },
      ],
      exams: [
        {
          _id: randomUUID(),
          name: 'Hemoglobina Glicada (HbA1c)',
          notes: '7,1% — melhora significativa.',
          resultImages: [],
        },
        {
          _id: randomUUID(),
          name: 'Microalbuminúria',
          notes: 'Sem proteinúria. Função renal preservada.',
          resultImages: [],
        },
      ],
      syncedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },

    {
      _id: randomUUID(),
      familyId: FAMILY_ID,
      memberId: carlosId,
      date: new Date('2026-01-14'),
      doctor: { name: 'Dr. Marcus Oliveira', specialty: 'Oftalmologia', customSpecialty: null },
      clinic: 'Oftalmocenter',
      reason: 'Avaliação oftalmológica anual — rastreio de retinopatia diabética',
      notes: 'Fundo de olho sem sinais de retinopatia. Leve miopia. Receita para óculos de leitura emitida.',
      tags: ['diabetes', 'oftalmologia', 'retinopatia'],
      returnOf: null,
      prescriptionImages: [],
      medications: [],
      exams: [
        {
          _id: randomUUID(),
          name: 'Fundoscopia (Fundo de Olho)',
          notes: 'Sem alterações. Ausência de retinopatia diabética.',
          resultImages: [],
        },
        {
          _id: randomUUID(),
          name: 'Acuidade Visual',
          notes: 'OD 20/25, OE 20/20. Leve miopia no OD.',
          resultImages: [],
        },
      ],
      syncedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },

    // ── LARA ─────────────────────────────────────────────────────────────────

    {
      _id: randomUUID(),
      familyId: FAMILY_ID,
      memberId: laraId,
      date: new Date('2025-07-22'),
      doctor: { name: 'Dra. Cláudia Mendes', specialty: 'Pneumologia', customSpecialty: null },
      clinic: 'Clínica do Pulmão',
      reason: 'Acompanhamento da asma — crise leve recente',
      notes: 'Crise desencadeada por exposição a mofo em ambiente escolar. VEF1 88%. Ajustada dose do corticoide inalatório. Reforçada importância do uso regular do controlador.',
      tags: ['asma', 'pneumologia', 'alérgico'],
      returnOf: null,
      prescriptionImages: [],
      medications: [
        {
          name: 'Budesonida + Formoterol',
          activeIngredient: 'Budesonida / Formoterol fumarato',
          dosage: '160/4,5mcg',
          form: 'SPRAY',
          frequency: '2 jatos 2x ao dia (manutenção)',
          contraindicated: false,
          restrictionReason: null,
          efficacy: 'EFICAZ',
          sideEffects: 'Leve rouquidão — bochechar após uso',
        },
        {
          name: 'Salbutamol',
          activeIngredient: 'Sulfato de salbutamol',
          dosage: '100mcg/dose',
          form: 'SPRAY',
          frequency: 'Uso em resgate (crise)',
          contraindicated: false,
          restrictionReason: null,
          efficacy: 'EFICAZ',
          sideEffects: 'Taquicardia em doses altas',
        },
      ],
      exams: [
        {
          _id: randomUUID(),
          name: 'Espirometria',
          notes: 'VEF1 88% do previsto. Padrão obstrutivo leve com resposta ao broncodilatador.',
          resultImages: [],
        },
        {
          _id: randomUUID(),
          name: 'Oximetria de Pulso',
          notes: 'SpO2 97% em ar ambiente.',
          resultImages: [],
        },
      ],
      syncedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },

    {
      _id: randomUUID(),
      familyId: FAMILY_ID,
      memberId: laraId,
      date: new Date('2025-10-08'),
      doctor: { name: 'Dra. Helena Vieira', specialty: 'Alergia e Imunologia', customSpecialty: null },
      clinic: 'Alergoclínica',
      reason: 'Investigação de rinite alérgica persistente',
      notes: 'Prick test positivo para ácaros D. pteronyssinus e D. farinae e pelos de gato. Imunoterapia subcutânea indicada. Evitar exposição ao alérgeno.',
      tags: ['rinite', 'alergia', 'imunoterapia'],
      returnOf: null,
      prescriptionImages: [],
      medications: [
        {
          name: 'Loratadina',
          activeIngredient: 'Loratadina',
          dosage: '10mg',
          form: 'COMPRIMIDO',
          frequency: '1x ao dia',
          contraindicated: false,
          restrictionReason: null,
          efficacy: 'PARCIAL',
          sideEffects: null,
        },
        {
          name: 'Mometasona furoato nasal',
          activeIngredient: 'Mometasona furoato',
          dosage: '50mcg/jato',
          form: 'SPRAY',
          frequency: '2 jatos em cada narina 1x ao dia',
          contraindicated: false,
          restrictionReason: null,
          efficacy: 'EFICAZ',
          sideEffects: null,
        },
      ],
      exams: [
        {
          _id: randomUUID(),
          name: 'Teste de hipersensibilidade cutânea (Prick Test)',
          notes: 'Positivo para D. pteronyssinus, D. farinae e Felis catus. Negativo para baratas e pólens.',
          resultImages: [],
        },
        {
          _id: randomUUID(),
          name: 'IgE total sérica',
          notes: '320 UI/mL — elevada. Compatível com atopia.',
          resultImages: [],
        },
      ],
      syncedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },

    {
      _id: randomUUID(),
      familyId: FAMILY_ID,
      memberId: laraId,
      date: new Date('2026-03-05'),
      doctor: { name: 'Dr. André Carvalho', specialty: 'Clínica Médica', customSpecialty: null },
      clinic: 'UBS Vila Nova',
      reason: 'Faringite e febre há 2 dias',
      notes: 'Exame físico: orofaringe hiperemiada com exsudato. Teste rápido para Streptococo positivo. Amoxicilina por 10 dias prescrita. Retorno se piora.',
      tags: ['infecção', 'faringite', 'urgência'],
      returnOf: null,
      prescriptionImages: [],
      medications: [
        {
          name: 'Amoxicilina',
          activeIngredient: 'Amoxicilina tri-hidratada',
          dosage: '500mg',
          form: 'CAPSULA',
          frequency: '3x ao dia por 10 dias',
          contraindicated: false,
          restrictionReason: null,
          efficacy: 'EFICAZ',
          sideEffects: null,
        },
        {
          name: 'Ibuprofeno',
          activeIngredient: 'Ibuprofeno',
          dosage: '400mg',
          form: 'COMPRIMIDO',
          frequency: 'A cada 8h se dor ou febre — máximo 3 dias',
          contraindicated: false,
          restrictionReason: null,
          efficacy: 'EFICAZ',
          sideEffects: 'Tomar com alimento para evitar irritação gástrica',
        },
      ],
      exams: [],
      syncedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  ];

  await db.collection('consultations').insertMany(consultations);
  console.log(`${consultations.length} consultas inseridas.`);

  console.log('\n=== Seed concluído ===');
  console.log(`familyId: ${FAMILY_ID}`);
  console.log(`Members : ${members.map(m => `${m.name} (${m._id})`).join('\n           ')}`);

  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
