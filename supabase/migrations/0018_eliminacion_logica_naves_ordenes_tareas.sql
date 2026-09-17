-- Fase 7a (Subfase 3/4): CRUD completo -- la auditoria encontro que ninguna entidad
-- transaccional del sistema (naves, ordenes de trabajo, tareas operativas) tenia forma
-- de eliminarse, y que una orden de trabajo cerrada (Validado/Cancelada) no tenia forma
-- de reabrirse. "Reabrir" no aplica a tareas operativas: su columna de Kanban ya es un
-- select libre en EditarTareaDialog, sin restriccion de estado terminal.
--
-- Misma politica de borrado que ya se definio para usuarios en 0017: nunca DELETE fisico,
-- siempre baja logica (`eliminado`). No se agregan policies nuevas -- las de UPDATE ya
-- existentes (0002/0012/0013) no distinguen columnas, así que ya cubren poner
-- eliminado=true para quien ya podia editar esa fila.

alter table naves add column eliminado boolean not null default false;
alter table ordenes_trabajo add column eliminado boolean not null default false;
alter table tareas_operativas add column eliminado boolean not null default false;
