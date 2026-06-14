export const EV_CATALOG: Record<string, string[]> = {
  "Audi": ["e-tron", "e-tron GT", "Q4 e-tron", "Q6 e-tron", "Q8 e-tron"],
  "BMW": ["i3", "i4", "i5", "i7", "iX", "iX1", "iX2", "iX3"],
  "BYD": ["Atto 3", "Dolphin", "Han", "Seal", "Seal U", "Tang"],
  "Citroën": ["ë-C4", "ë-Berlingo", "ë-Jumpy"],
  "Cupra": ["Born", "Tavascan"],
  "Fiat": ["500e", "600e"],
  "Ford": ["Mustang Mach-E", "F-150 Lightning", "E-Transit"],
  "Genesis": ["GV60", "Electrified GV70", "Electrified G80"],
  "Honda": ["e", "e:Ny1", "Prologue"],
  "Hyundai": ["Ioniq 5", "Ioniq 6", "Kona Electric", "Ioniq 9"],
  "Jaguar": ["I-Pace"],
  "Kia": ["EV3", "EV5", "EV6", "EV9", "Niro EV", "Soul EV"],
  "Lexus": ["RZ", "UX 300e"],
  "Mazda": ["MX-30"],
  "Mercedes-Benz": ["EQA", "EQB", "EQC", "EQE", "EQE SUV", "EQS", "EQS SUV", "EQV"],
  "MG": ["MG4", "MG5", "ZS EV", "Cyberster"],
  "Mini": ["Cooper Electric", "Aceman", "Countryman Electric"],
  "NIO": ["ET5", "ET7", "ES6", "ES7", "ES8", "EC6", "EC7"],
  "Nissan": ["Leaf", "Ariya"],
  "Opel": ["Corsa-e", "Mokka-e", "Astra Electric", "Combo-e"],
  "Peugeot": ["e-208", "e-2008", "e-308", "e-3008", "e-Rifter"],
  "Polestar": ["2", "3", "4"],
  "Porsche": ["Taycan", "Macan Electric"],
  "Renault": ["Zoe", "Megane E-Tech", "Scenic E-Tech", "5 E-Tech"],
  "Rivian": ["R1T", "R1S"],
  "Skoda": ["Enyaq", "Enyaq Coupé"],
  "Smart": ["#1", "#3"],
  "Subaru": ["Solterra"],
  "Tesla": ["Model 3", "Model Y", "Model S", "Model X", "Cybertruck"],
  "Toyota": ["bZ4X", "Proace City Electric"],
  "Volkswagen": ["ID.3", "ID.4", "ID.5", "ID.7", "ID. Buzz"],
  "Volvo": ["EX30", "EX40", "EX90", "C40 Recharge"],
  "Xpeng": ["P5", "P7", "G6", "G9"],
  "Other": ["Other"],
};

export const EV_MAKES = Object.keys(EV_CATALOG).sort();

export function modelsForMake(make: string): string[] {
  return EV_CATALOG[make] ?? [];
}