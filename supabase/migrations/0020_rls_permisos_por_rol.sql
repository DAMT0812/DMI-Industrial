-- Fase 7a (Subfase 4/4, Punto de control 2/3): reescribe cada policy de RLS que hoy
-- embebe una lista de rol literal para que en su lugar llame a tiene_permiso(...), usando
-- la tabla permisos_por_rol sembrada en 0019. El texto de cada policy se tomó tal cual de
-- pg_policies antes de este cambio (no de una relectura de las migraciones), reemplazando
-- únicamente el fragmento `mi_rol() = ANY (ARRAY[...])` / `mi_rol() <> ALL (ARRAY[...])`
-- por su equivalente en tiene_permiso() -- el resto (ámbito regional, joins, el self-check
-- de usuario_id en capex_votos) queda carácter por carácter igual.

-- naves
alter policy insert_naves on naves with check (
  mi_ambito_permite((select pq.region from parques pq where pq.id = naves.parque_id))
  and tiene_permiso('editar_nave')
);
alter policy update_naves on naves
  using (
    mi_ambito_permite((select pq.region from parques pq where pq.id = naves.parque_id))
    and tiene_permiso('editar_nave')
  )
  with check (
    mi_ambito_permite((select pq.region from parques pq where pq.id = naves.parque_id))
    and tiene_permiso('editar_nave')
  );

-- documentos (rama Predial/CFE/Agua/Ambiental -> editar_documento_predial_cfe; resto -> editar_documento_obra)
alter policy insert_documentos on documentos with check (
  mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = documentos.nave_id))
  and (
    (tipo = any (array['Predial','Contrato CFE','Contrato de Agua y Drenaje','Licencia Ambiental Estatal']) and tiene_permiso('editar_documento_predial_cfe'))
    or (tipo <> all (array['Predial','Contrato CFE','Contrato de Agua y Drenaje','Licencia Ambiental Estatal']) and tiene_permiso('editar_documento_obra'))
  )
);
alter policy update_documentos on documentos with check (
  mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = documentos.nave_id))
  and (
    (tipo = any (array['Predial','Contrato CFE','Contrato de Agua y Drenaje','Licencia Ambiental Estatal']) and tiene_permiso('editar_documento_predial_cfe'))
    or (tipo <> all (array['Predial','Contrato CFE','Contrato de Agua y Drenaje','Licencia Ambiental Estatal']) and tiene_permiso('editar_documento_obra'))
  )
);

-- documento_versiones (mismo criterio de dos ramas, dentro del exists)
alter policy insert_documento_versiones on documento_versiones with check (
  exists (
    select 1 from documentos d join naves n on n.id = d.nave_id join parques pq on pq.id = n.parque_id
    where d.id = documento_versiones.documento_id
      and mi_ambito_permite(pq.region)
      and (
        (d.tipo = any (array['Predial','Contrato CFE','Contrato de Agua y Drenaje','Licencia Ambiental Estatal']) and tiene_permiso('editar_documento_predial_cfe'))
        or (d.tipo <> all (array['Predial','Contrato CFE','Contrato de Agua y Drenaje','Licencia Ambiental Estatal']) and tiene_permiso('editar_documento_obra'))
      )
  )
);

-- contratos
alter policy select_contratos on contratos using (
  mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = contratos.nave_id))
  and tiene_permiso('ver_contrato')
);
alter policy insert_contratos on contratos with check (
  mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = contratos.nave_id))
  and tiene_permiso('editar_contrato')
);
alter policy update_contratos on contratos
  using (
    mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = contratos.nave_id))
    and tiene_permiso('editar_contrato')
  )
  with check (
    mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = contratos.nave_id))
    and tiene_permiso('editar_contrato')
  );

-- renovaciones (editar_contrato y resolver_renovacion juntos reconstruyen PM+Dirección+Superadmin)
alter policy select_renovaciones on renovaciones using (
  mi_ambito_permite((select pq.region from contratos c join naves n on n.id = c.nave_id join parques pq on pq.id = n.parque_id where c.id = renovaciones.contrato_id))
  and tiene_permiso('ver_contrato')
);
alter policy insert_renovaciones on renovaciones with check (
  mi_ambito_permite((select pq.region from contratos c join naves n on n.id = c.nave_id join parques pq on pq.id = n.parque_id where c.id = renovaciones.contrato_id))
  and (tiene_permiso('editar_contrato') or tiene_permiso('resolver_renovacion'))
);
alter policy update_renovaciones on renovaciones
  using (
    mi_ambito_permite((select pq.region from contratos c join naves n on n.id = c.nave_id join parques pq on pq.id = n.parque_id where c.id = renovaciones.contrato_id))
    and (tiene_permiso('editar_contrato') or tiene_permiso('resolver_renovacion'))
  )
  with check (
    mi_ambito_permite((select pq.region from contratos c join naves n on n.id = c.nave_id join parques pq on pq.id = n.parque_id where c.id = renovaciones.contrato_id))
    and (tiene_permiso('editar_contrato') or tiene_permiso('resolver_renovacion'))
  );

-- ordenes_trabajo / ordenes_pausas / ordenes_evidencia (mismo patron, escribir_orden = PM+FM+Superadmin)
alter policy insert_ordenes_trabajo on ordenes_trabajo with check (
  mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = ordenes_trabajo.nave_id))
  and tiene_permiso('escribir_orden')
);
alter policy update_ordenes_trabajo on ordenes_trabajo
  using (
    mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = ordenes_trabajo.nave_id))
    and tiene_permiso('escribir_orden')
  )
  with check (
    mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = ordenes_trabajo.nave_id))
    and tiene_permiso('escribir_orden')
  );

alter policy insert_ordenes_pausas on ordenes_pausas with check (
  exists (
    select 1 from ordenes_trabajo o join naves n on n.id = o.nave_id join parques pq on pq.id = n.parque_id
    where o.id = ordenes_pausas.orden_id and mi_ambito_permite(pq.region)
  )
  and tiene_permiso('escribir_orden')
);
alter policy update_ordenes_pausas on ordenes_pausas
  using (
    mi_ambito_permite((select pq.region from ordenes_trabajo o join naves n on n.id = o.nave_id join parques pq on pq.id = n.parque_id where o.id = ordenes_pausas.orden_id))
    and tiene_permiso('escribir_orden')
  )
  with check (
    mi_ambito_permite((select pq.region from ordenes_trabajo o join naves n on n.id = o.nave_id join parques pq on pq.id = n.parque_id where o.id = ordenes_pausas.orden_id))
    and tiene_permiso('escribir_orden')
  );

alter policy insert_ordenes_evidencia on ordenes_evidencia with check (
  exists (
    select 1 from ordenes_trabajo o join naves n on n.id = o.nave_id join parques pq on pq.id = n.parque_id
    where o.id = ordenes_evidencia.orden_id and mi_ambito_permite(pq.region)
  )
  and tiene_permiso('escribir_orden')
);
alter policy update_ordenes_evidencia on ordenes_evidencia
  using (
    mi_ambito_permite((select pq.region from ordenes_trabajo o join naves n on n.id = o.nave_id join parques pq on pq.id = n.parque_id where o.id = ordenes_evidencia.orden_id))
    and tiene_permiso('escribir_orden')
  )
  with check (
    mi_ambito_permite((select pq.region from ordenes_trabajo o join naves n on n.id = o.nave_id join parques pq on pq.id = n.parque_id where o.id = ordenes_evidencia.orden_id))
    and tiene_permiso('escribir_orden')
  );

-- tareas_operativas
alter policy insert_tareas_operativas on tareas_operativas with check (
  mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = tareas_operativas.nave_id))
  and tiene_permiso('editar_tarea')
);
alter policy update_tareas_operativas on tareas_operativas
  using (
    mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = tareas_operativas.nave_id))
    and tiene_permiso('editar_tarea')
  )
  with check (
    mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = tareas_operativas.nave_id))
    and tiene_permiso('editar_tarea')
  );

-- proyectos_capex (update: editar_capex y resolver_capex juntos reconstruyen PM+FM+Dirección+Superadmin)
alter policy insert_proyectos_capex on proyectos_capex with check (
  mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = proyectos_capex.nave_id))
  and tiene_permiso('editar_capex')
);
alter policy update_proyectos_capex on proyectos_capex
  using (
    mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = proyectos_capex.nave_id))
    and (tiene_permiso('editar_capex') or tiene_permiso('resolver_capex'))
  )
  with check (
    mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = proyectos_capex.nave_id))
    and (tiene_permiso('editar_capex') or tiene_permiso('resolver_capex'))
  );

-- capex_cotizaciones
alter policy insert_capex_cotizaciones on capex_cotizaciones with check (
  exists (
    select 1 from proyectos_capex p join naves n on n.id = p.nave_id join parques pq on pq.id = n.parque_id
    where p.id = capex_cotizaciones.proyecto_capex_id and mi_ambito_permite(pq.region)
  )
  and tiene_permiso('editar_capex')
);

-- capex_votos (el self-check usuario_id = auth.uid() se conserva intacto)
alter policy insert_capex_votos on capex_votos with check (
  exists (
    select 1 from proyectos_capex p join naves n on n.id = p.nave_id join parques pq on pq.id = n.parque_id
    where p.id = capex_votos.proyecto_id and mi_ambito_permite(pq.region)
  )
  and tiene_permiso('votar_capex')
  and usuario_id = auth.uid()
);
alter policy update_capex_votos on capex_votos
  using (
    exists (
      select 1 from proyectos_capex p join naves n on n.id = p.nave_id join parques pq on pq.id = n.parque_id
      where p.id = capex_votos.proyecto_id and mi_ambito_permite(pq.region)
    )
    and tiene_permiso('votar_capex')
    and usuario_id = auth.uid()
  )
  with check (
    exists (
      select 1 from proyectos_capex p join naves n on n.id = p.nave_id join parques pq on pq.id = n.parque_id
      where p.id = capex_votos.proyecto_id and mi_ambito_permite(pq.region)
    )
    and tiene_permiso('votar_capex')
    and usuario_id = auth.uid()
  );

-- bitacora
alter policy select_bitacora on bitacora using (tiene_permiso('ver_bitacora'));
