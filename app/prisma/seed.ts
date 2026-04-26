import { PrismaClient, Opportunity } from "@prisma/client";

const prisma = new PrismaClient();

const companies = [
  // Lisbon — Gyms
  { placeId: "seed_gym_lisboa_1", name: "Fitness Studio Lisboa", address: "Rua Augusta 45, Lisboa", industry: "gym", location: "Lisboa", website: "https://fitnesslisboa.pt", hasWebsite: true, opportunity: Opportunity.NONE, email: "info@fitnesslisboa.pt" },
  { placeId: "seed_gym_lisboa_2", name: "Ginásio Central", address: "Avenida da Liberdade 120, Lisboa", industry: "gym", location: "Lisboa", website: null, hasWebsite: false, opportunity: Opportunity.NO_WEBSITE, email: null },
  { placeId: "seed_gym_lisboa_3", name: "CrossFit LX", address: "Rua do Ouro 78, Lisboa", industry: "gym", location: "Lisboa", website: "https://crossfitlx.pt", hasWebsite: true, opportunity: Opportunity.WEAK_WEBSITE, email: null },

  // Lisbon — Clinics
  { placeId: "seed_health_lisboa_1", name: "Clínica São João", address: "Rua Garrett 22, Lisboa", industry: "healthcare", location: "Lisboa", website: "https://clinicasaojoao.pt", hasWebsite: true, opportunity: Opportunity.NONE, email: "geral@clinicasaojoao.pt" },
  { placeId: "seed_health_lisboa_2", name: "Centro Médico Belém", address: "Rua de Belém 5, Lisboa", industry: "healthcare", location: "Lisboa", website: null, hasWebsite: false, opportunity: Opportunity.NO_WEBSITE, email: null },
  { placeId: "seed_health_lisboa_3", name: "Fisioterapia Lisboa", address: "Rua da Prata 88, Lisboa", industry: "healthcare", location: "Lisboa", website: "http://fisioterapia-lisboa.pt", hasWebsite: true, opportunity: Opportunity.WEAK_WEBSITE, email: null },

  // Lisbon — Restaurants
  { placeId: "seed_rest_lisboa_1", name: "Tasca do Bacalhau", address: "Rua das Portas de Santo Antão 10, Lisboa", industry: "restaurant", location: "Lisboa", website: null, hasWebsite: false, opportunity: Opportunity.NO_WEBSITE, email: null },
  { placeId: "seed_rest_lisboa_2", name: "Restaurante Alfama", address: "Largo do Chafariz de Dentro 3, Lisboa", industry: "restaurant", location: "Lisboa", website: "https://restaurante-alfama.pt", hasWebsite: true, opportunity: Opportunity.WEAK_WEBSITE, email: null },

  // Porto — Gyms
  { placeId: "seed_gym_porto_1", name: "Academia do Porto", address: "Rua de Santa Catarina 200, Porto", industry: "gym", location: "Porto", website: null, hasWebsite: false, opportunity: Opportunity.NO_WEBSITE, email: null },
  { placeId: "seed_gym_porto_2", name: "Power Gym Porto", address: "Avenida dos Aliados 55, Porto", industry: "gym", location: "Porto", website: "https://powergymporto.pt", hasWebsite: true, opportunity: Opportunity.WEAK_WEBSITE, email: "contacto@powergymporto.pt" },

  // Porto — Clinics
  { placeId: "seed_health_porto_1", name: "Clínica Boa Viagem", address: "Rua do Almada 18, Porto", industry: "healthcare", location: "Porto", website: "https://clinicaboaviagem.pt", hasWebsite: true, opportunity: Opportunity.NONE, email: "info@clinicaboaviagem.pt" },
  { placeId: "seed_health_porto_2", name: "Centro de Saúde Cedofeita", address: "Rua de Cedofeita 112, Porto", industry: "healthcare", location: "Porto", website: null, hasWebsite: false, opportunity: Opportunity.NO_WEBSITE, email: null },
  { placeId: "seed_health_porto_3", name: "Ortopedia Porto", address: "Praça da República 7, Porto", industry: "healthcare", location: "Porto", website: "http://ortopedia-porto.com", hasWebsite: true, opportunity: Opportunity.WEAK_WEBSITE, email: null },

  // Porto — Restaurants
  { placeId: "seed_rest_porto_1", name: "Taberna do Bairro", address: "Rua da Firmeza 44, Porto", industry: "restaurant", location: "Porto", website: null, hasWebsite: false, opportunity: Opportunity.NO_WEBSITE, email: null },
  { placeId: "seed_rest_porto_2", name: "Cozinha da Ribeira", address: "Cais da Ribeira 20, Porto", industry: "restaurant", location: "Porto", website: "https://cozinhadaribeira.pt", hasWebsite: true, opportunity: Opportunity.NONE, email: "reservas@cozinhadaribeira.pt" },

  // Braga — Gyms
  { placeId: "seed_gym_braga_1", name: "Ginásio Braga Center", address: "Avenida Central 30, Braga", industry: "gym", location: "Braga", website: null, hasWebsite: false, opportunity: Opportunity.NO_WEBSITE, email: null },
  { placeId: "seed_gym_braga_2", name: "Fit Club Braga", address: "Rua do Souto 15, Braga", industry: "gym", location: "Braga", website: "https://fitclubbraga.pt", hasWebsite: true, opportunity: Opportunity.WEAK_WEBSITE, email: null },

  // Braga — Clinics
  { placeId: "seed_health_braga_1", name: "Clínica Bom Jesus", address: "Rua Dom Diogo de Sousa 8, Braga", industry: "healthcare", location: "Braga", website: null, hasWebsite: false, opportunity: Opportunity.NO_WEBSITE, email: null },
  { placeId: "seed_health_braga_2", name: "Centro Médico Braga", address: "Praça do Município 3, Braga", industry: "healthcare", location: "Braga", website: "https://centromedicobraga.pt", hasWebsite: true, opportunity: Opportunity.NONE, email: "marcacoes@centromedicobraga.pt" },

  // Braga — Restaurant
  { placeId: "seed_rest_braga_1", name: "Restaurante O Inácio", address: "Campo das Hortas 4, Braga", industry: "restaurant", location: "Braga", website: null, hasWebsite: false, opportunity: Opportunity.NO_WEBSITE, email: null },
];

async function main() {
  console.log("Seeding database...");
  await prisma.company.deleteMany();
  await prisma.company.createMany({ data: companies });
  console.log(`Seeded ${companies.length} companies.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
