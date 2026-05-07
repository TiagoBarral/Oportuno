const SYNONYM_MAP: Record<string, string[]> = {
  "bar": ["pub", "cervejaria", "taberna", "snack-bar", "cocktail bar"],
  "restaurante": ["tasca", "bistro", "marisqueira", "churrasqueira", "cantina"],
  "cafe": ["pastelaria", "cafetaria", "gelataria", "padaria", "confeitaria"],
  "pastelaria": ["cafe", "padaria", "confeitaria", "gelataria", "cafetaria"],
  "padaria": ["pastelaria", "cafe", "confeitaria", "mercearia"],
  "cabeleireiro": ["barbearia", "salão de beleza", "barbeiro", "estética"],
  "barbearia": ["cabeleireiro", "barbeiro", "salão de beleza"],
  "ginasio": ["fitness", "crossfit", "pilates", "yoga", "health club"],
  "fitness": ["ginasio", "crossfit", "pilates", "yoga"],
  "clinica": ["centro médico", "consultório", "fisioterapia", "medicina dentária"],
  "dentista": ["clínica dentária", "medicina dentária", "ortodontia", "estomatologia"],
  "farmacia": ["parafarmácia", "drogaria", "ervanária"],
  "hotel": ["hostel", "pensão", "alojamento local", "guesthouse", "pousada"],
  "hostel": ["hotel", "pensão", "alojamento local", "guesthouse"],
  "advogado": ["escritório de advocacia", "solicitador", "notário", "jurídico"],
  "contabilidade": ["contabilista", "fiscalidade", "gestão financeira", "TOC"],
  "agencia marketing": ["publicidade", "comunicação", "branding", "design gráfico"],
  "design": ["design gráfico", "agência criativa", "branding", "comunicação"],
  "informatica": ["tecnologia", "software", "IT", "desenvolvimento web", "suporte informático"],
  "eletricista": ["electricidade", "instalações elétricas", "manutenção elétrica"],
  "canalização": ["canalizador", "encanador", "hidráulica", "água e saneamento"],
  "construção": ["empreiteiro", "obras", "remodelação", "arquitetura"],
  "imobiliaria": ["mediação imobiliária", "agência imobiliária", "arrendamento", "compra e venda"],
  "transporte": ["mudanças", "logística", "fretes", "entregas"],
  "mecanico": ["oficina automóvel", "reparação automóvel", "revisão auto", "garagem"],
  "oficina": ["mecânico", "reparação automóvel", "revisão auto", "pneus"],
  "pet shop": ["veterinário", "loja animais", "grooming", "canil"],
  "veterinario": ["clínica veterinária", "pet shop", "animais de companhia"],
  "escola": ["centro de estudos", "explicações", "formação", "ensino"],
  "fotografia": ["fotografo", "estúdio fotográfico", "videografia", "reportagem"],
};

function normalise(term: string): string {
  return term
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .trim();
}

export function getSynonymSuggestions(term: string): string[] {
  const key = normalise(term);
  return SYNONYM_MAP[key] ?? [];
}
