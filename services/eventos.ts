export const defaults = {
  nombre: "",
  fecha: "",
  hora: "",
  recinto: "",
  direccion: "",
  abierto: false,
  limite: 100,
  unidad: "personas",
  integrantes: 1,
  documento: "opcional",
  tipos: ["RUT", "DNI", "Pasaporte"],
  nombres_mesas: [] as string[],
  mesas: false,
  credenciales: true,
};
export type Evento = typeof defaults & { id: string; ocupados?: number };
export type Inscrito = {
  id: string;
  nombre: string;
  mesa: string;
  grupo: string;
  ingreso: string | null;
};
export function detalle(e: typeof defaults) {
  return [
    e.fecha.split("-").reverse().join("/"),
    e.hora.slice(0, 5),
    e.recinto,
    e.direccion,
  ]
    .filter(Boolean)
    .join(" · ");
}
