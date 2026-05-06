// Maps canonical municipality name (must match CITY_NAMES) to individual
// searchable place names extracted from official parish data.
// Merged post-2013 parish names are split into their component localities.
export const MUNICIPALITY_PARISHES: Record<string, string[]> = {
  "Lisboa": [
    "Ajuda", "Alcântara", "Alvalade", "Areeiro", "Arroios", "Avenidas Novas",
    "Beato", "Belém", "Benfica", "Campo de Ourique", "Campolide", "Carnide",
    "Estrela", "Lumiar", "Marvila", "Misericórdia", "Olivais", "Parque das Nações",
    "Penha de França", "Santa Clara", "Santa Maria Maior", "Santo António",
    "São Domingos de Benfica", "São Vicente",
  ],
  "Porto": [
    "Aldoar", "Foz do Douro", "Nevogilde", "Bonfim", "Campanhã",
    "Cedofeita", "Santo Ildefonso", "Sé", "Miragaia", "São Nicolau", "Vitória",
    "Lordelo do Ouro", "Massarelos", "Paranhos", "Ramalde",
  ],
  "Braga": [
    "Adaúfe", "Esporões", "Ferreiros", "Gondizalves", "Figueiredo",
    "Gualtar", "Lamaçães", "Lomar", "Arcos", "Merelim", "Panoias",
    "Parada de Tibães", "Frossos", "Mire de Tibães", "Morreira", "Trandeiras",
    "Nogueira", "Fraião", "Nogueiró", "Tenões", "Palmeira", "Pedralva",
    "Real", "Dume", "Semelhe", "Ruilhe", "Tadim", "Tebosa",
    "Vilaça", "Fradelos",
  ],
  "Coimbra": [
    "Almalaguês", "Assafarge", "Antanhol", "Brasfemes", "Ceira", "Cernache",
    "Almedina", "Eiras", "São Paulo de Frades", "Santa Clara", "Castelo Viegas",
    "Santo António dos Olivais", "São João do Campo", "São Martinho de Árvore",
    "Lamarosa", "São Silvestre", "Souselas", "Botão", "Torres do Mondego",
    "Trouxemil", "Torre de Vilela",
  ],
  "Aveiro": [
    "Aradas", "Cacia", "Eixo", "Eirol", "Esgueira", "Glória", "Vera Cruz",
    "Oliveirinha", "Requeixo", "Nariz", "São Bernardo", "São Jacinto",
  ],
  "Faro": [
    "Conceição", "Estoi", "Montenegro", "Santa Bárbara de Nexe",
  ],
  "Setúbal": [
    "Azeitão", "Gâmbia", "Pontes", "Alto da Guerra", "Sado", "São Sebastião", "São Julião",
  ],
  "Guimarães": [
    "Abação", "Airão Santa Maria", "Airão São João", "Vermil", "Aldão",
    "Arosa", "Castelões", "Atães", "Rendufe", "Azurém", "Barco",
    "Briteiros", "Donim", "Brito", "Caldelas", "Candoso", "Mascotelos",
    "Costa", "Creixomil", "Fermentões", "Gondar", "Gonça", "Guardizela",
    "Infantas", "Longos", "Lordelo", "Mesão Frio", "Moreira de Cónegos",
    "Nespereira", "Pencelo", "Pinheiro", "Polvoreira", "Ponte",
    "Prazins", "Corvite", "Ronfe", "São Torcato", "Selho", "Gominhães",
    "Serzedelo", "Silvares", "Tabuadelo", "Urgezes",
  ],
  "Viseu": [
    "Abraveses", "Barreiros", "Cepões", "Boa Aldeia", "Farminhão", "Torredeita",
    "Bodiosa", "Calde", "Cavernães", "Côta", "Coutos de Viseu",
    "Fail", "Vila Chã de Sá", "Fragosela", "Lordosa", "Mundão", "Orgens",
    "Povolide", "Ranhados", "Repeses", "São Salvador", "Rio de Loba",
    "São Cipriano", "Vil de Souto", "São João de Lourosa", "São Pedro de France",
    "Silgueiros",
  ],
  "Leiria": [
    "Amor", "Arrabal", "Bajouca", "Bidoeira de Cima", "Caranguejeira",
    "Coimbrão", "Colmeias", "Memória", "Pousos", "Barreira", "Cortes",
    "Maceira", "Marrazes", "Barosa", "Milagres", "Monte Real", "Carvide",
    "Monte Redondo", "Carreira", "Parceiros", "Azoia", "Regueira de Pontes",
    "Santa Catarina da Serra", "Chainça", "Souto da Carpalhosa", "Ortigosa",
  ],
  "Oeiras": [
    "Algés", "Linda-a-Velha", "Cruz Quebrada", "Dafundo", "Barcarena",
    "Carnaxide", "Queijas", "Paço de Arcos", "Caxias", "Porto Salvo",
  ],
  "Cascais": [
    "Alcabideche", "Carcavelos", "Parede", "Estoril", "São Domingos de Rana",
  ],
  "Sintra": [
    "Agualva", "Mira-Sintra", "Algueirão", "Mem Martins", "Rinchoa",
    "Almargem do Bispo", "Pêro Pinheiro", "Montelavar", "Cacém", "São Marcos",
    "Casal de Cambra", "Colares", "Massamá", "Monte Abraão", "Queluz", "Belas",
    "Rio de Mouro", "São João das Lampas", "Terrugem",
  ],
  "Loures": [
    "Bucelas", "Fanhões", "Lousa", "Moscavide", "Portela",
    "Sacavém", "Prior Velho", "Santa Iria de Azoia", "São João da Talha",
    "Bobadela", "Santo Antão do Tojal", "São Julião do Tojal",
    "Santo António dos Cavaleiros", "Frielas", "Camarate", "Unhos", "Apelação",
  ],
  "Odivelas": [
    "Ramada", "Caneças", "Pontinha", "Famões", "Póvoa de Santo Adrião", "Olival Basto",
  ],
  "Barreiro": [
    "Alto do Seixalinho", "Santo André", "Verderena", "Lavradio",
    "Palhais", "Coina", "Santo António da Charneca",
  ],
  "Montijo": [
    "Atalaia", "Alto Estanqueiro", "Canha", "Afonsoeiro", "Pegões", "Sarilhos Grandes",
  ],
  "Almada": [
    "Cova da Piedade", "Pragal", "Cacilhas", "Caparica", "Trafaria",
    "Charneca de Caparica", "Sobreda", "Costa da Caparica", "Laranjeiro", "Feijó",
  ],
  "Matosinhos": [
    "Custóias", "Leça do Balio", "Guifões", "Leça da Palmeira",
    "Perafita", "Lavra", "Santa Cruz do Bispo", "São Mamede de Infesta", "Senhora da Hora",
  ],
  "Vila Nova de Gaia": [
    "Arcozelo", "Avintes", "Canelas", "Canidelo", "Grijó", "Sermonde",
    "Gulpilhares", "Valadares", "Madalena", "Mafamude", "Vilar do Paraíso",
    "Oliveira do Douro", "Pedroso", "Seixezelo", "Sandim", "Olival", "Lever",
    "Crestuma", "Santa Marinha", "São Pedro da Afurada", "São Félix da Marinha",
    "Serzedo", "Perosinho",
  ],
  "Gondomar": [
    "Baguim do Monte", "Rio Tinto", "Fânzeres", "São Pedro da Cova",
    "Foz do Sousa", "Covelo", "Valbom", "Jovim", "Lomba", "Melres", "Medas",
  ],
  "Maia": [
    "Águas Santas", "Castêlo da Maia", "Cidade da Maia", "Folgosa", "Milheirós",
    "Moreira", "Nogueira", "Silva Escura", "Pedrouços", "São Pedro Fins", "Vila Nova da Telha",
  ],
  "Valongo": [
    "Alfena", "Campo", "Sobrado", "Ermesinde",
  ],
  "Évora": [
    "Bacelo", "Senhora da Saúde", "Canaviais", "Malagueira", "Horta das Figueiras",
    "Nossa Senhora da Tourega", "Nossa Senhora de Guadalupe", "São Bento do Mato",
    "São Manços", "São Miguel de Machede", "Torre de Coelheiros",
  ],
  "Santarém": [
    "Achete", "Azoia de Baixo", "Póvoa de Santarém", "Alcanede", "Almoster",
    "Amiais de Baixo", "Arneiro das Milhariças", "Azoia de Cima", "Tremês",
    "Casével", "Vaqueiros", "Gançaria", "Moçarria", "Pernes", "Póvoa da Isenta",
    "Romeira", "Várzea", "São Vicente do Paul", "Vale de Figueira",
  ],
  "Portimão": [
    "Alvor", "Mexilhoeira Grande",
  ],
  "Funchal": [
    "Imaculado Coração de Maria", "Monte", "Santa Luzia", "Santa Maria Maior",
    "Santo António", "São Gonçalo", "São Martinho", "São Pedro", "São Roque", "Sé",
  ],
  "Viana do Castelo": [
    "Afife", "Areosa", "Barroselas", "Carvoeiro", "Carreço", "Cardielos",
    "Serreleis", "Chafé", "Darque", "Deão", "Freixieiro de Soutelo",
    "Geraz do Lima", "Lanheses", "Mazarefes", "Vila Fria", "Meadela",
    "Monserrate", "Mujães", "Nogueira", "Meixedo", "Vilar de Murteda",
    "Outeiro", "Perre", "Santa Marta de Portuzelo", "Subportela",
    "Torre", "Vila Mou", "Vila de Punhe",
  ],
  "Barcelos": [
    "Abade de Neiva", "Aborim", "Adães", "Airó", "Aldreu", "Alvelos",
    "Alvito", "Couto", "Barcelinhos", "Barqueiros", "Cambeses",
    "Carapeços", "Carvalhal", "Chorente", "Góios", "Courel", "Pedra Furada",
    "Cossourado", "Cristelo", "Durrães", "Tregosa", "Fornelos", "Fragoso",
    "Galegos", "Gamil", "Midões", "Gilmonde", "Lama", "Lijó",
    "Macieira de Rates", "Manhente", "Martim", "Milhazes", "Vilar de Figos", "Faria",
    "Moure", "Oliveira", "Palme", "Panque", "Paradela", "Pereira",
    "Perelhal", "Pousa", "Remelhe", "Roriz", "Silva", "Tamel",
    "Ucha", "Várzea", "Vila Cova", "Vila Seca",
  ],
};

export interface LocationOption {
  label: string;        // shown in dropdown: "Rinchoa (Sintra)" or "Sintra"
  chipLabel: string;    // shown in chip: "Rinchoa" or "Sintra"
  municipality: string; // sent to API: "Sintra"
  isParish: boolean;
}
