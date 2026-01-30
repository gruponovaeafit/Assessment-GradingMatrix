
-- -------------------------
-- GrupoEstudiantil
-- -------------------------
create table public."GrupoEstudiantil" (
  "ID_GrupoEstudiantil" integer generated always as identity primary key,
  "Nombre_GrupoEstudiantil" varchar(100) not null,
  "Descripcion_GrupoEstudiantil" varchar(255),
  "CreatedAt_GrupoEstudiantil" timestamptz not null default now()
);

-- -------------------------
-- Assessment (N por GrupoEstudiantil)
-- -------------------------
create table public."Assessment" (
  "ID_Assessment" integer generated always as identity primary key,
  "ID_GrupoEstudiantil" integer not null,
  "Nombre_Assessment" varchar(120) not null,
  "Descripcion_Assessment" varchar(255),
  "Activo_Assessment" boolean not null default true,
  "CreatedAt_Assessment" timestamptz not null default now(),
  constraint "FK_Assessment_GrupoEstudiantil"
    foreign key ("ID_GrupoEstudiantil") references public."GrupoEstudiantil"("ID_GrupoEstudiantil")
    on update restrict on delete restrict
);

create index if not exists "IX_Assessment_GrupoEstudiantil"
  on public."Assessment" ("ID_GrupoEstudiantil");

-- -------------------------
-- GrupoAssessment (N por Assessment)
-- -------------------------
create table public."GrupoAssessment" (
  "ID_GrupoAssessment" integer generated always as identity primary key,
  "ID_Assessment" integer not null,
  "Nombre_GrupoAssessment" varchar(100) not null,
  "Descripcion_GrupoAssessment" varchar(255),
  "CreatedAt_GrupoAssessment" timestamptz not null default now(),
  constraint "FK_GrupoAssessment_Assessment"
    foreign key ("ID_Assessment") references public."Assessment"("ID_Assessment")
    on update restrict on delete restrict
);

create index if not exists "IX_GrupoAssessment_Assessment"
  on public."GrupoAssessment" ("ID_Assessment");

-- -------------------------
-- Bases (N por Assessment) + Numero_Base único por assessment
-- -------------------------
create table public."Bases" (
  "ID_Base" integer generated always as identity primary key,
  "ID_Assessment" integer not null,
  "Numero_Base" integer not null,

  "Nombre_Base" varchar(100) not null,
  "Competencia_Base" varchar(255) not null,
  "Descripcion_Base" varchar(512) not null,
  "Comportamiento1_Base" varchar(512) not null,
  "Comportamiento2_Base" varchar(512) not null,
  "Comportamiento3_Base" varchar(512) not null,

  constraint "FK_Bases_Assessment"
    foreign key ("ID_Assessment") references public."Assessment"("ID_Assessment")
    on update restrict on delete restrict,

  constraint "UQ_Bases_Numero_PorAssessment"
    unique ("ID_Assessment", "Numero_Base")
);

create index if not exists "IX_Bases_Assessment"
  on public."Bases" ("ID_Assessment");

-- Para FK compuesta (ID_Base, ID_Assessment) desde Staff/Calificaciones
create unique index if not exists "UX_Bases_IDBase_IDAssessment"
  on public."Bases" ("ID_Base", "ID_Assessment");

-- -------------------------
-- Staff (N por Assessment) + Rol_Staff
-- (correo único dentro del assessment)
-- -------------------------
create table public."Staff" (
  "ID_Staff" integer generated always as identity primary key,
  "ID_Assessment" integer not null,

  "Correo_Staff" varchar(100) not null,
  "Contrasena_Staff" varchar(255) not null,
  "Rol_Staff" varchar(100) not null,

  "ID_Base" integer null,
  "ID_GrupoAssessment" integer null,
  "Rotaciones_Staff" integer not null default 0,

  constraint "FK_Staff_Assessment"
    foreign key ("ID_Assessment") references public."Assessment"("ID_Assessment")
    on update restrict on delete restrict,

  constraint "UQ_Staff_Correo_PorAssessment"
    unique ("ID_Assessment", "Correo_Staff"),

  -- Si ID_Base != null, obliga a que la Base sea del MISMO Assessment
  constraint "FK_Staff_Base_MismoAssessment"
    foreign key ("ID_Base", "ID_Assessment")
    references public."Bases"("ID_Base", "ID_Assessment")
    on update restrict on delete set null
  ,
  constraint "FK_Staff_GrupoAssessment"
    foreign key ("ID_GrupoAssessment") references public."GrupoAssessment"("ID_GrupoAssessment")
    on update restrict on delete set null
);

create index if not exists "IX_Staff_Assessment"
  on public."Staff" ("ID_Assessment");

-- Para FK compuesta (ID_Staff, ID_Assessment) desde Calificaciones
create unique index if not exists "UX_Staff_IDStaff_IDAssessment"
  on public."Staff" ("ID_Staff", "ID_Assessment");

-- -------------------------
-- Participante (N por Assessment)
-- (correo único dentro del assessment)
-- -------------------------
create table public."Participante" (
  "ID_Participante" integer generated always as identity primary key,
  "ID_Assessment" integer not null,
  "ID_GrupoAssessment" integer null,

  "Nombre_Participante" varchar(100) not null,
  "Correo_Participante" varchar(100) not null,
  "Rol_Participante" varchar(255),
  "FotoUrl_Participante" varchar(1000),

  constraint "FK_Participante_Assessment"
    foreign key ("ID_Assessment") references public."Assessment"("ID_Assessment")
    on update restrict on delete restrict,

  constraint "FK_Participante_GrupoAssessment"
    foreign key ("ID_GrupoAssessment") references public."GrupoAssessment"("ID_GrupoAssessment")
    on update restrict on delete set null,

  constraint "UQ_Participante_Correo_PorAssessment"
    unique ("ID_Assessment", "Correo_Participante")
);

create index if not exists "IX_Participante_Assessment"
  on public."Participante" ("ID_Assessment");

create index if not exists "IX_Participante_GrupoAssessment"
  on public."Participante" ("ID_GrupoAssessment");

-- Para FK compuesta (ID_Participante, ID_Assessment) desde Calificaciones
create unique index if not exists "UX_Participante_IDPart_IDAssessment"
  on public."Participante" ("ID_Participante", "ID_Assessment");

-- -------------------------
-- CalificacionesPorPersona (dentro del Assessment)
-- * Fecha automática
-- * Calificación 1..5
-- * FKs compuestas para asegurar mismo Assessment
-- -------------------------
create table public."CalificacionesPorPersona" (
  "ID_Calificacion" integer generated always as identity primary key,
  "ID_Assessment" integer not null,

  "ID_Base" integer not null,
  "ID_Staff" integer not null,
  "ID_Participante" integer not null,

  "Fecha_Calificacion" timestamptz not null default now(),

  "Calificacion_1" numeric(4,2),
  "Calificacion_2" numeric(4,2),
  "Calificacion_3" numeric(4,2),

  constraint "FK_Calif_Assessment"
    foreign key ("ID_Assessment") references public."Assessment"("ID_Assessment")
    on update restrict on delete restrict,

  constraint "FK_Calif_Base_MismoAssessment"
    foreign key ("ID_Base", "ID_Assessment")
    references public."Bases"("ID_Base", "ID_Assessment")
    on update restrict on delete restrict,

  constraint "FK_Calif_Staff_MismoAssessment"
    foreign key ("ID_Staff", "ID_Assessment")
    references public."Staff"("ID_Staff", "ID_Assessment")
    on update restrict on delete restrict,

  constraint "FK_Calif_Participante_MismoAssessment"
    foreign key ("ID_Participante", "ID_Assessment")
    references public."Participante"("ID_Participante", "ID_Assessment")
    on update restrict on delete restrict,

  constraint "CHK_Calif1_1a5" check ("Calificacion_1" is null or ("Calificacion_1" between 1 and 5)),
  constraint "CHK_Calif2_1a5" check ("Calificacion_2" is null or ("Calificacion_2" between 1 and 5)),
  constraint "CHK_Calif3_1a5" check ("Calificacion_3" is null or ("Calificacion_3" between 1 and 5))
);

create index if not exists "IX_Calif_Assessment"
  on public."CalificacionesPorPersona" ("ID_Assessment");

create index if not exists "IX_Calif_Base"
  on public."CalificacionesPorPersona" ("ID_Base");

create index if not exists "IX_Calif_Staff"
  on public."CalificacionesPorPersona" ("ID_Staff");

create index if not exists "IX_Calif_Participante"
  on public."CalificacionesPorPersona" ("ID_Participante");

-- Evitar duplicados: mismo staff califica al mismo participante en la misma base dentro del mismo assessment
create unique index if not exists "UX_Calif_NoDuplicado"
  on public."CalificacionesPorPersona"
  ("ID_Assessment", "ID_Base", "ID_Staff", "ID_Participante");
