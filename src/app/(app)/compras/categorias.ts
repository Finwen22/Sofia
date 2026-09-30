export const CATEGORIAS = [
  { code: "higiene", label: "Higiene y pañales" },
  { code: "alimentacion", label: "Alimentación" },
  { code: "farmacia", label: "Farmacia" },
  { code: "ropa", label: "Ropa" },
  { code: "casa", label: "Casa" },
  { code: "otros", label: "Otros" },
] as const;

// Lo que más se repone en los primeros meses: un toque y queda en la lista.
export const SUGERENCIAS: { name: string; category: string }[] = [
  { name: "Pañales", category: "higiene" },
  { name: "Toallitas húmedas", category: "higiene" },
  { name: "Crema para la cola", category: "higiene" },
  { name: "Algodón", category: "higiene" },
  { name: "Alcohol al 70 %", category: "farmacia" },
  { name: "Gasas estériles", category: "farmacia" },
  { name: "Vitamina D en gotas", category: "farmacia" },
  { name: "Solución fisiológica", category: "farmacia" },
  { name: "Leche de fórmula", category: "alimentacion" },
  { name: "Discos absorbentes", category: "alimentacion" },
  { name: "Bolsas para leche materna", category: "alimentacion" },
  { name: "Jabón neutro para bebé", category: "higiene" },
];
