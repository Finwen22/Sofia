// Se muestra apenas tocás algo, mientras llegan los datos de la pantalla.
export default function Cargando() {
  return (
    <div aria-busy="true" aria-label="Cargando" className="flex animate-pulse flex-col gap-4">
      <div className="h-4 w-40 rounded-full bg-surface" />
      <div className="h-10 w-48 rounded-2xl bg-surface" />
      <div className="h-[78px] rounded-[20px] bg-surface" />
      <div className="h-36 rounded-[20px] bg-surface" />
      <div className="grid grid-cols-2 gap-2.5">
        <div className="h-24 rounded-[20px] bg-surface" />
        <div className="h-24 rounded-[20px] bg-surface" />
      </div>
      <div className="h-16 rounded-[20px] bg-surface" />
    </div>
  );
}
