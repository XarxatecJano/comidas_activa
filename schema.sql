-- Menu Planner Database Schema
-- PostgreSQL Database Initialization Script

-- Drop tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS "ShoppingList" CASCADE;
DROP TABLE IF EXISTS "Dish" CASCADE;
DROP TABLE IF EXISTS "MealDiner" CASCADE;
DROP TABLE IF EXISTS "Diner" CASCADE;
DROP TABLE IF EXISTS "FamilyMember" CASCADE;
DROP TABLE IF EXISTS "Meal" CASCADE;
DROP TABLE IF EXISTS "MenuPlan" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Tabla User
CREATE TABLE "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  preferences TEXT,
  default_diners INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla MenuPlan
CREATE TABLE "MenuPlan" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla Meal
CREATE TABLE "Meal" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_plan_id UUID REFERENCES "MenuPlan"(id) ON DELETE CASCADE,
  day_of_week VARCHAR(20) NOT NULL,
  meal_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla FamilyMember (personas relacionadas con el usuario)
CREATE TABLE "FamilyMember" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  preferences TEXT,
  dietary_restrictions TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla Diner (mantener por compatibilidad - deprecated)
CREATE TABLE "Diner" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES "Meal"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  preferences TEXT
);

-- Tabla MealDiner (relación muchos a muchos entre Meal y FamilyMember)
CREATE TABLE "MealDiner" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES "Meal"(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES "FamilyMember"(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(meal_id, family_member_id)
);

-- Tabla Dish
CREATE TABLE "Dish" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES "Meal"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  ingredients JSONB,
  course VARCHAR(20) NOT NULL
);

-- Tabla ShoppingList
CREATE TABLE "ShoppingList" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_plan_id UUID REFERENCES "MenuPlan"(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_menuplan_user ON "MenuPlan"(user_id);
CREATE INDEX idx_menuplan_status ON "MenuPlan"(status);
CREATE INDEX idx_meal_menuplan ON "Meal"(menu_plan_id);
CREATE INDEX idx_familymember_user ON "FamilyMember"(user_id);
CREATE INDEX idx_diner_meal ON "Diner"(meal_id);
CREATE INDEX idx_mealdiner_meal ON "MealDiner"(meal_id);
CREATE INDEX idx_mealdiner_familymember ON "MealDiner"(family_member_id);
CREATE INDEX idx_dish_meal ON "Dish"(meal_id);
CREATE INDEX idx_shoppinglist_menuplan ON "ShoppingList"(menu_plan_id);

-- Comentarios para documentación
COMMENT ON TABLE "User" IS 'Usuarios de la aplicación';
COMMENT ON TABLE "MenuPlan" IS 'Planificaciones de menús semanales';
COMMENT ON TABLE "Meal" IS 'Comidas individuales dentro de una planificación';
COMMENT ON TABLE "FamilyMember" IS 'Miembros de familia y personas relacionadas con cada usuario';
COMMENT ON TABLE "Diner" IS 'Comensales para cada comida (deprecated - usar MealDiner)';
COMMENT ON TABLE "MealDiner" IS 'Relación entre comidas y miembros de familia que comerán';
COMMENT ON TABLE "Dish" IS 'Platos de cada comida';
COMMENT ON TABLE "ShoppingList" IS 'Listas de compra generadas';

-- Mensaje de éxito
DO $$
BEGIN
  RAISE NOTICE '✓ Database schema created successfully!';
  RAISE NOTICE 'Tables created: User, MenuPlan, Meal, Diner, Dish, ShoppingList';
END $$;
