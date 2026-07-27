"use client";

import { useMemo, useState } from "react";
import {
  Armchair,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Pencil,
  Search,
  Trash2,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";

type Guest = {
  id: number;
  name: string;
  circle: string;
  companion?: string;
};

type GalaTable = {
  id: number;
  number: number;
  name: string;
  capacity: number;
  zone: "Autoridades" | "Central" | "General";
  guests: Guest[];
};

const seedGuests = [
  ["Eduardo Martínez Azócar", "Círculo Mayor"],
  ["Distinguida señora", "Invitada"],
  ["Yamal Raya Hurtado", "Comité Organizador"],
  ["Rodrigo Ponce", "Servicios Diplomáticos"],
  ["Fernando Pérez", "40ª COP FF.EE."],
  ["María Elena Cofré", "60ª Comisaría Metro"],
  ["Donatto González", "Rancagua"],
  ["Patricio Castro", "40ª COP FF.EE."],
  ["Marco Mondaca", "Servicios Diplomáticos"],
  ["Nicolás Rojas", "40ª COP FF.EE."],
  ["Alejandro A.", "Santiago"],
  ["Alberto M.", "Santiago"],
  ["Emilio G.", "Santiago"],
  ["Jhonny M.", "Santiago"],
];

function createInitialTables(): GalaTable[] {
  return Array.from({ length: 22 }, (_, index) => {
    const number = index + 1;
    const zone: GalaTable["zone"] =
      number <= 3 ? "Autoridades" : number <= 14 ? "Central" : "General";

    const guestCount =
      number === 1 ? 8 :
      number === 2 ? 10 :
      number === 3 ? 6 :
      number <= 8 ? 7 :
      number <= 14 ? 5 :
      number <= 18 ? 3 : 0;

    return {
      id: number,
      number,
      name: number === 1 ? "Mesa Presidencial" : `Mesa ${number}`,
      capacity: 10,
      zone,
      guests: Array.from({ length: guestCount }, (_, guestIndex) => {
        const base = seedGuests[(index * 2 + guestIndex) % seedGuests.length];
        return {
          id: number * 100 + guestIndex,
          name: guestIndex === 0 && number === 1 ? "Eduardo Martínez Azócar" : `${base[0]}${number > 3 ? ` ${number}` : ""}`,
          circle: base[1],
        };
      }),
    };
  });
}

const emptyGuest = { name: "", circle: "" };

export default function TablesPage() {
  const [tables, setTables] = useState<GalaTable[]>(createInitialTables);
  const [selectedId, setSelectedId] = useState<number>(1);
  const [query, setQuery] = useState("");
  const [zoneFilter, setZoneFilter] = useState("Todas");
  const [tableModal, setTableModal] = useState(false);
  const [guestModal, setGuestModal] = useState(false);
  const [tableForm, setTableForm] = useState({
    name: "",
    capacity: 10,
    zone: "General" as GalaTable["zone"],
  });
  const [guestForm, setGuestForm] = useState(emptyGuest);

  const selected = tables.find((table) => table.id === selectedId) ?? tables[0];

  const totals = useMemo(() => {
    const seats = tables.reduce((sum, table) => sum + table.capacity, 0);
    const occupied = tables.reduce((sum, table) => sum + table.guests.length, 0);
    const full = tables.filter((table) => table.guests.length >= table.capacity).length;
    return { seats, occupied, available: seats - occupied, full };
  }, [tables]);

  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const matchesText = `${table.name} ${table.number}`.toLowerCase().includes(query.toLowerCase());
      const matchesZone = zoneFilter === "Todas" || table.zone === zoneFilter;
      return matchesText && matchesZone;
    });
  }, [tables, query, zoneFilter]);

  function tableStatus(table: GalaTable) {
    const free = table.capacity - table.guests.length;
    if (free <= 0) return "full";
    if (free <= 3) return "limited";
    return "available";
  }

  function openEditTable() {
    setTableForm({
      name: selected.name,
      capacity: selected.capacity,
      zone: selected.zone,
    });
    setTableModal(true);
  }

  function saveTable() {
    if (!tableForm.name.trim() || tableForm.capacity < 1) return;
    setTables((current) =>
      current.map((table) =>
        table.id === selected.id ? { ...table, ...tableForm } : table
      )
    );
    setTableModal(false);
  }

  function addGuest() {
    if (!guestForm.name.trim()) return;
    if (selected.guests.length >= selected.capacity) return;

    setTables((current) =>
      current.map((table) =>
        table.id === selected.id
          ? {
              ...table,
              guests: [
                ...table.guests,
                { id: Date.now(), name: guestForm.name, circle: guestForm.circle || "Sin círculo" },
              ],
            }
          : table
      )
    );
    setGuestForm(emptyGuest);
    setGuestModal(false);
  }

  function removeGuest(guestId: number) {
    setTables((current) =>
      current.map((table) =>
        table.id === selected.id
          ? { ...table, guests: table.guests.filter((guest) => guest.id !== guestId) }
          : table
      )
    );
  }

  function moveGuest(guest: Guest, direction: -1 | 1) {
    const currentIndex = tables.findIndex((table) => table.id === selected.id);
    const target = tables[currentIndex + direction];
    if (!target || target.guests.length >= target.capacity) return;

    setTables((current) =>
      current.map((table) => {
        if (table.id === selected.id) {
          return { ...table, guests: table.guests.filter((item) => item.id !== guest.id) };
        }
        if (table.id === target.id) {
          return { ...table, guests: [...table.guests, guest] };
        }
        return table;
      })
    );
    setSelectedId(target.id);
  }

  return (
    <AdminShell>
      <main className="adminPage">
        <section className="pageHeading">
          <div>
            <p className="adminEyebrow">Plano y asignación</p>
            <h1>Mesas del salón</h1>
            <p>
              Distribuye a los asistentes, revisa la ocupación y organiza las
              zonas del evento.
            </p>
          </div>
          <button className="adminAction primary" onClick={() => setGuestModal(true)}>
            <UserPlus size={18} />
            Asignar asistente
          </button>
        </section>

        <section className="summaryStrip tableSummary">
          <div><span>Mesas</span><strong>{tables.length}</strong></div>
          <div><span>Cupos totales</span><strong>{totals.seats}</strong></div>
          <div><span>Asignados</span><strong>{totals.occupied}</strong></div>
          <div><span>Disponibles</span><strong>{totals.available}</strong></div>
          <div><span>Mesas completas</span><strong>{totals.full}</strong></div>
        </section>

        <section className="floorToolbar">
          <label className="searchBox">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar una mesa..."
            />
          </label>
          <select value={zoneFilter} onChange={(event) => setZoneFilter(event.target.value)}>
            <option>Todas</option>
            <option>Autoridades</option>
            <option>Central</option>
            <option>General</option>
          </select>
          <div className="tableLegend">
            <span><i className="legendAvailableTable" /> Disponible</span>
            <span><i className="legendLimitedTable" /> Pocos cupos</span>
            <span><i className="legendFullTable" /> Completa</span>
          </div>
        </section>

        <section className="tablesWorkspace">
          <div className="floorPlan">
            <div className="stage">
              <span>ESCENARIO PRINCIPAL</span>
              <strong>II GRAN GALA NACIONAL 2026</strong>
            </div>

            <div className="floorZone authoritiesZone">
              <p>Zona de autoridades</p>
              <div className="tableFloorGrid featuredTables">
                {filteredTables.filter((table) => table.zone === "Autoridades").map((table) => (
                  <TableNode
                    key={table.id}
                    table={table}
                    active={selected.id === table.id}
                    status={tableStatus(table)}
                    onSelect={() => setSelectedId(table.id)}
                  />
                ))}
              </div>
            </div>

            <div className="danceFloor">
              <span>Pista de baile</span>
            </div>

            <div className="floorZone">
              <p>Salón central</p>
              <div className="tableFloorGrid">
                {filteredTables.filter((table) => table.zone === "Central").map((table) => (
                  <TableNode
                    key={table.id}
                    table={table}
                    active={selected.id === table.id}
                    status={tableStatus(table)}
                    onSelect={() => setSelectedId(table.id)}
                  />
                ))}
              </div>
            </div>

            <div className="floorZone generalZone">
              <p>Zona general</p>
              <div className="tableFloorGrid">
                {filteredTables.filter((table) => table.zone === "General").map((table) => (
                  <TableNode
                    key={table.id}
                    table={table}
                    active={selected.id === table.id}
                    status={tableStatus(table)}
                    onSelect={() => setSelectedId(table.id)}
                  />
                ))}
              </div>
            </div>

            <div className="floorFooter">
              <span>Acceso principal</span>
              <span>Recepción y acreditación</span>
            </div>
          </div>

          <aside className="tableInspector">
            <div className="inspectorHeader">
              <div>
                <p className="adminEyebrow">{selected.zone}</p>
                <h2>{selected.name}</h2>
              </div>
              <button onClick={openEditTable} title="Editar mesa">
                <Pencil size={18} />
              </button>
            </div>

            <div className="occupancyBlock">
              <div className="occupancyNumbers">
                <strong>{selected.guests.length}</strong>
                <span>de {selected.capacity} lugares</span>
              </div>
              <div className="occupancyTrack">
                <span
                  style={{
                    width: `${Math.min(100, (selected.guests.length / selected.capacity) * 100)}%`,
                  }}
                />
              </div>
              <small>
                {Math.max(0, selected.capacity - selected.guests.length)} cupos disponibles
              </small>
            </div>

            <div className="guestListHeader">
              <h3>Personas asignadas</h3>
              <button onClick={() => setGuestModal(true)}>
                <CirclePlus size={17} /> Agregar
              </button>
            </div>

            <div className="assignedGuestList">
              {selected.guests.length === 0 && (
                <div className="emptyTable">
                  <Armchair size={35} />
                  <strong>Mesa sin asignaciones</strong>
                  <span>Agrega asistentes para comenzar.</span>
                </div>
              )}

              {selected.guests.map((guest, index) => (
                <article className="assignedGuest" key={guest.id}>
                  <i>{index + 1}</i>
                  <div>
                    <strong>{guest.name}</strong>
                    <span>{guest.circle}</span>
                  </div>
                  <div className="guestMoveActions">
                    <button
                      title="Mover a mesa anterior"
                      onClick={() => moveGuest(guest, -1)}
                      disabled={selected.id === tables[0].id}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      title="Mover a mesa siguiente"
                      onClick={() => moveGuest(guest, 1)}
                      disabled={selected.id === tables[tables.length - 1].id}
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button title="Quitar de la mesa" onClick={() => removeGuest(guest.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </section>

        {tableModal && (
          <div className="modalLayer">
            <div className="formModal smallModal">
              <div className="modalHeader">
                <div>
                  <p className="adminEyebrow">Configuración</p>
                  <h2>Editar mesa</h2>
                </div>
                <button onClick={() => setTableModal(false)}><X /></button>
              </div>

              <div className="formGrid">
                <label>
                  Nombre de la mesa
                  <input
                    value={tableForm.name}
                    onChange={(event) => setTableForm({ ...tableForm, name: event.target.value })}
                  />
                </label>
                <label>
                  Capacidad
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={tableForm.capacity}
                    onChange={(event) => setTableForm({ ...tableForm, capacity: Number(event.target.value) })}
                  />
                </label>
                <label>
                  Zona
                  <select
                    value={tableForm.zone}
                    onChange={(event) =>
                      setTableForm({ ...tableForm, zone: event.target.value as GalaTable["zone"] })
                    }
                  >
                    <option>Autoridades</option>
                    <option>Central</option>
                    <option>General</option>
                  </select>
                </label>
              </div>

              <div className="modalActions">
                <button className="adminAction" onClick={() => setTableModal(false)}>Cancelar</button>
                <button className="adminAction primary" onClick={saveTable}>Guardar cambios</button>
              </div>
            </div>
          </div>
        )}

        {guestModal && (
          <div className="modalLayer">
            <div className="formModal smallModal">
              <div className="modalHeader">
                <div>
                  <p className="adminEyebrow">Asignación de asiento</p>
                  <h2>Agregar a {selected.name}</h2>
                </div>
                <button onClick={() => setGuestModal(false)}><X /></button>
              </div>

              {selected.guests.length >= selected.capacity ? (
                <div className="fullTableNotice">
                  <CheckCircle2 />
                  <strong>Esta mesa está completa</strong>
                  <p>Selecciona otra mesa o aumenta su capacidad.</p>
                </div>
              ) : (
                <div className="formGrid">
                  <label>
                    Nombre completo
                    <input
                      value={guestForm.name}
                      onChange={(event) => setGuestForm({ ...guestForm, name: event.target.value })}
                    />
                  </label>
                  <label>
                    Círculo o institución
                    <input
                      value={guestForm.circle}
                      onChange={(event) => setGuestForm({ ...guestForm, circle: event.target.value })}
                    />
                  </label>
                </div>
              )}

              <div className="modalActions">
                <button className="adminAction" onClick={() => setGuestModal(false)}>Cancelar</button>
                {selected.guests.length < selected.capacity && (
                  <button className="adminAction primary" onClick={addGuest}>Asignar a la mesa</button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminShell>
  );
}

function TableNode({
  table,
  active,
  status,
  onSelect,
}: {
  table: GalaTable;
  active: boolean;
  status: "available" | "limited" | "full";
  onSelect: () => void;
}) {
  const free = Math.max(0, table.capacity - table.guests.length);

  return (
    <button
      className={`tableNode ${status} ${active ? "selected" : ""}`}
      onClick={onSelect}
      aria-label={`${table.name}, ${table.guests.length} de ${table.capacity} lugares ocupados`}
    >
      <span className="chair chairTop" />
      <span className="chair chairRight" />
      <span className="chair chairBottom" />
      <span className="chair chairLeft" />
      <strong>{table.number}</strong>
      <small>{free === 0 ? "Completa" : `${free} libres`}</small>
    </button>
  );
}
