
const initialCampaigns = [
  {
    id: '1',
    title: 'Clean Water for Lagos Slums',
    ngoName: 'Lagos Water Aid',
    description: 'Installing solar-powered water purification units in Makoko. This project aims to reduce waterborne diseases affecting over 2,000 families in the coastal community.',
    targetAmount: 5000,
    raisedAmount: 3200,
    status: 'FUNDRAISING',
    category: 'Infrastructure',
    imageUrl: 'https://images.unsplash.com/photo-1574482620826-40685ca5ebd2?auto=format&fit=crop&q=80&w=800',
    beneficiariesCount: 2500,
    location: 'Makoko, Lagos',
    createdAt: '2023-10-15'
  },
  {
    id: '2',
    title: 'Tech Skills for Abuja Youth',
    ngoName: 'Naija Code Academy',
    description: 'Providing laptops and a 6-month full-stack development bootcamp for unemployed graduates in Abuja. Funds are locked until hardware delivery is verified.',
    targetAmount: 15000,
    raisedAmount: 15000,
    status: 'LOCKED_FUNDED',
    category: 'Education',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
    beneficiariesCount: 100,
    location: 'FCT, Abuja',
    trustScore: 94,
    auditReport: 'High confidence. Supplier contracts with Slot Systems verified.',
    createdAt: '2023-09-20'
  },
  {
    id: '3',
    title: 'Flood Relief in Kogi State',
    ngoName: 'Red Cross Nigeria',
    description: 'Immediate distribution of food, mosquito nets, and medical supplies for displaced flood victims along the Benue river.',
    targetAmount: 8000,
    raisedAmount: 8000,
    status: 'VERIFICATION_PENDING',
    category: 'Disaster Relief',
    imageUrl: 'https://images.unsplash.com/photo-1599939571322-792a326991f2?auto=format&fit=crop&q=80&w=800',
    beneficiariesCount: 5000,
    location: 'Lokoja, Kogi',
    proofOfWork: 'ipfs://QmXyZ...delivery_manifest.pdf',
    createdAt: '2023-10-05'
  },
  {
    id: '4',
    title: 'Solar Power for Enugu Clinics',
    ngoName: 'Green Energy Naija',
    description: 'Equipping 5 rural health centers with solar inverters to ensure 24/7 vaccine refrigeration and lighting.',
    targetAmount: 6500,
    raisedAmount: 6500,
    status: 'DISBURSED',
    category: 'Healthcare',
    imageUrl: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=800',
    beneficiariesCount: 12000,
    location: 'Nsukka, Enugu',
    proofOfWork: 'ipfs://QmSolar...install_pics.jpg',
    nftBadgeMinted: true,
    beneficiaryIds: ['addr_ben...9x'], 
    createdAt: '2023-08-12'
  },
  {
    id: '5',
    title: 'Primary School Renovation',
    ngoName: 'Educate Kano',
    description: 'Rebuilding dilapidated classroom blocks and providing desks for 3 primary schools in rural Kano.',
    targetAmount: 12000,
    raisedAmount: 4500,
    status: 'FUNDRAISING',
    category: 'Education',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800',
    beneficiariesCount: 800,
    location: 'Kano Municipal',
    createdAt: '2023-10-20'
  },
  {
    id: '6',
    title: 'Malaria Nets for Delta',
    ngoName: 'Health First Initiative',
    description: 'Distribution of treated mosquito nets to pregnant women and children under 5 in riverine communities.',
    targetAmount: 3000,
    raisedAmount: 2800,
    status: 'FUNDRAISING',
    category: 'Healthcare',
    imageUrl: 'https://images.unsplash.com/photo-1584515933487-9d9fc112a36b?auto=format&fit=crop&q=80&w=800',
    beneficiariesCount: 4000,
    location: 'Warri, Delta',
    createdAt: '2023-10-22'
  },
  {
    id: '7',
    title: 'SME Grants for Women',
    ngoName: 'Women Rise PH',
    description: 'Micro-grants for 50 market women in Port Harcourt to restock their shops after recent fire incidents.',
    targetAmount: 10000,
    raisedAmount: 10000,
    status: 'LOCKED_FUNDED',
    category: 'Infrastructure',
    imageUrl: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&q=80&w=800',
    beneficiariesCount: 50,
    location: 'Port Harcourt, Rivers',
    createdAt: '2023-09-15'
  },
  {
    id: '8',
    title: 'Digital Literacy Kaduna',
    ngoName: 'Tech Northern Girls',
    description: 'Teaching basic computer skills and coding to 200 girls in secondary schools.',
    targetAmount: 5000,
    raisedAmount: 1200,
    status: 'FUNDRAISING',
    category: 'Education',
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800',
    beneficiariesCount: 200,
    location: 'Kaduna North',
    createdAt: '2023-10-25'
  },
  {
    id: '9',
    title: 'Reforestation Cross River',
    ngoName: 'Green Earth Calabar',
    description: 'Planting 10,000 trees to combat deforestation and protect biodiversity in the Oban Hills.',
    targetAmount: 8500,
    raisedAmount: 8500,
    status: 'VERIFICATION_PENDING',
    category: 'Environment',
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800',
    beneficiariesCount: 15000,
    location: 'Calabar, Cross River',
    proofOfWork: 'ipfs://QmTree...planting_log.csv',
    createdAt: '2023-09-01'
  },
  {
    id: '10',
    title: 'Orphanage Support Ibadan',
    ngoName: 'Hope Homes',
    description: 'Annual food and clothing supply for the Gentle Hands Orphanage.',
    targetAmount: 2500,
    raisedAmount: 2500,
    status: 'COMPLETED',
    category: 'Healthcare',
    imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800',
    beneficiariesCount: 45,
    location: 'Ibadan, Oyo',
    createdAt: '2023-07-10'
  },
  {
    id: '11',
    title: 'IDP Food Bank Maiduguri',
    ngoName: 'North East Relief',
    description: 'Emergency food staples (Rice, Beans, Oil) for 500 families in IDP camps.',
    targetAmount: 20000,
    raisedAmount: 18500,
    status: 'FUNDRAISING',
    category: 'Disaster Relief',
    imageUrl: 'https://images.unsplash.com/photo-1594708767771-a7502209ff51?auto=format&fit=crop&q=80&w=800',
    beneficiariesCount: 3000,
    location: 'Maiduguri, Borno',
    createdAt: '2023-10-28'
  },
  {
    id: '12',
    title: 'Market Sanitation Units',
    ngoName: 'Clean Anambra',
    description: 'Building modern toilet facilities in the Onitsha Main Market to improve public hygiene.',
    targetAmount: 7000,
    raisedAmount: 7000,
    status: 'DISBURSED',
    category: 'Infrastructure',
    imageUrl: 'https://images.unsplash.com/photo-1517260739337-6799d2ff04c1?auto=format&fit=crop&q=80&w=800',
    beneficiariesCount: 50000,
    location: 'Onitsha, Anambra',
    proofOfWork: 'ipfs://QmToilet...construction_video.mp4',
    nftBadgeMinted: true,
    createdAt: '2023-08-05'
  },
  {
    id: '13',
    title: 'Textbooks for Rural Schools',
    ngoName: 'Ogun Edu Trust',
    description: 'Supplying Math and English textbooks to 10 remote primary schools.',
    targetAmount: 4000,
    raisedAmount: 1500,
    status: 'FUNDRAISING',
    category: 'Education',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800',
    beneficiariesCount: 1200,
    location: 'Abeokuta, Ogun',
    createdAt: '2023-10-29'
  },
  {
    id: '14',
    title: 'Vocational Training Widows',
    ngoName: 'Benue Sisters',
    description: 'Sewing machines and tailoring training for 30 widows affected by conflicts.',
    targetAmount: 6000,
    raisedAmount: 6000,
    status: 'VERIFICATION_PENDING',
    category: 'Education',
    imageUrl: 'https://images.unsplash.com/photo-1558230554-1f7470f1a302?auto=format&fit=crop&q=80&w=800',
    beneficiariesCount: 30,
    location: 'Makurdi, Benue',
    proofOfWork: 'ipfs://QmSewing...class_attendance.pdf',
    createdAt: '2023-09-30'
  },
  {
    id: '15',
    title: 'Solar Streetlights Sokoto',
    ngoName: 'Light Up North',
    description: 'Installing 50 solar streetlights in off-grid villages to improve security.',
    targetAmount: 9000,
    raisedAmount: 2000,
    status: 'FUNDRAISING',
    category: 'Infrastructure',
    imageUrl: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&q=80&w=800',
    beneficiariesCount: 5000,
    location: 'Sokoto City',
    createdAt: '2023-10-30'
  }
];

const initialTransactions = [
  // Recent
  { hash: 'tx_a1...bc', campaignId: '15', from: 'addr_donor_x', to: 'sc_pool', amount: 500, timestamp: new Date().toLocaleString(), type: 'DONATION', blockHeight: 9234500 },
  { hash: 'tx_a2...de', campaignId: '15', from: 'addr_donor_y', to: 'sc_pool', amount: 1500, timestamp: new Date().toLocaleString(), type: 'DONATION', blockHeight: 9234480 },
  { hash: 'tx_b3...fg', campaignId: '13', from: 'addr_donor_z', to: 'sc_pool', amount: 1000, timestamp: new Date().toLocaleString(), type: 'DONATION', blockHeight: 9234300 },
  { hash: 'tx_c4...hi', campaignId: '11', from: 'addr_donor_a', to: 'sc_pool', amount: 10000, timestamp: new Date().toLocaleString(), type: 'DONATION', blockHeight: 9234200 },
  { hash: 'tx_c5...jk', campaignId: '11', from: 'addr_donor_b', to: 'sc_pool', amount: 8500, timestamp: new Date().toLocaleString(), type: 'DONATION', blockHeight: 9234150 },
  
  // Mid
  { hash: 'tx_d6...lm', campaignId: '8', from: 'addr_donor_c', to: 'sc_pool', amount: 1200, timestamp: new Date().toLocaleString(), type: 'DONATION', blockHeight: 9234101 },
  { hash: 'tx_e7...no', campaignId: '2', from: 'addr_donor_d', to: 'sc_pool', amount: 5000, timestamp: new Date().toLocaleString(), type: 'DONATION', blockHeight: 9234050 },
  { hash: 'tx_e8...pq', campaignId: '2', from: 'addr_donor_e', to: 'sc_pool', amount: 10000, timestamp: new Date().toLocaleString(), type: 'DONATION', blockHeight: 9234040 },
  { hash: 'tx_f9...rs', campaignId: '6', from: 'addr_donor_f', to: 'sc_pool', amount: 2800, timestamp: new Date().toLocaleString(), type: 'DONATION', blockHeight: 9233900 },
  
  // Actions
  { hash: 'tx_g0...tu', campaignId: '3', from: 'addr_ngo', to: 'sc_contract', amount: 0, timestamp: new Date().toLocaleString(), type: 'PROOF_SUBMISSION', blockHeight: 9234220 },
  { hash: 'tx_h1...vw', campaignId: '9', from: 'addr_ngo_cross', to: 'sc_contract', amount: 0, timestamp: new Date().toLocaleString(), type: 'PROOF_SUBMISSION', blockHeight: 9233500 },
  { hash: 'tx_i2...xy', campaignId: '14', from: 'addr_ngo_benue', to: 'sc_contract', amount: 0, timestamp: new Date().toLocaleString(), type: 'PROOF_SUBMISSION', blockHeight: 9233200 },
  
  // Disbursements & Completion
  { hash: 'tx_j3...zA', campaignId: '4', from: 'sc_contract', to: 'addr_ngo_green', amount: 6500, timestamp: new Date().toLocaleString(), type: 'DISBURSEMENT', blockHeight: 9233000 },
  { hash: 'tx_k4...BC', campaignId: '4', from: 'sc_policy', to: 'addr_ngo_green', amount: 0, timestamp: new Date().toLocaleString(), type: 'NFT_MINT', blockHeight: 9233005 },
  { hash: 'tx_l5...DE', campaignId: '12', from: 'sc_contract', to: 'addr_ngo_anambra', amount: 7000, timestamp: new Date().toLocaleString(), type: 'DISBURSEMENT', blockHeight: 9232000 },
  { hash: 'tx_m6...FG', campaignId: '12', from: 'sc_policy', to: 'addr_ngo_anambra', amount: 0, timestamp: new Date().toLocaleString(), type: 'NFT_MINT', blockHeight: 9232005 },
  
  // Older
  { hash: 'tx_n7...HI', campaignId: '10', from: 'addr_donor_old', to: 'sc_pool', amount: 2500, timestamp: new Date().toLocaleString(), type: 'DONATION', blockHeight: 9220000 },
  { hash: 'tx_o8...JK', campaignId: '10', from: 'sc_contract', to: 'addr_ngo_hope', amount: 2500, timestamp: new Date().toLocaleString(), type: 'DISBURSEMENT', blockHeight: 9225000 },
  { hash: 'tx_p9...LM', campaignId: '10', from: 'addr_ben...old', to: 'sc_contract', amount: 0, timestamp: new Date().toLocaleString(), type: 'COMPLETED', blockHeight: 9225500 },
  
  // More filler transactions
  { hash: 'tx_q0...NO', campaignId: '7', from: 'addr_donor_g', to: 'sc_pool', amount: 5000, timestamp: new Date().toLocaleString(), type: 'DONATION', blockHeight: 9230000 },
  { hash: 'tx_r1...PQ', campaignId: '7', from: 'addr_donor_h', to: 'sc_pool', amount: 5000, timestamp: new Date().toLocaleString(), type: 'DONATION', blockHeight: 9230100 },
  { hash: 'tx_s2...RS', campaignId: '5', from: 'addr_donor_i', to: 'sc_pool', amount: 2000, timestamp: new Date().toLocaleString(), type: 'DONATION', blockHeight: 9233800 },
  { hash: 'tx_t3...TU', campaignId: '5', from: 'addr_donor_j', to: 'sc_pool', amount: 2500, timestamp: new Date().toLocaleString(), type: 'DONATION', blockHeight: 9233850 },
  { hash: 'tx_u4...VW', campaignId: '1', from: 'addr_donor_k', to: 'sc_pool', amount: 1000, timestamp: new Date().toLocaleString(), type: 'DONATION', blockHeight: 9232500 },
  { hash: 'tx_v5...XY', campaignId: '1', from: 'addr_donor_l', to: 'sc_pool', amount: 1700, timestamp: new Date().toLocaleString(), type: 'DONATION', blockHeight: 9232600 }
];

module.exports = {
  campaigns: [...initialCampaigns],
  transactions: [...initialTransactions]
};
