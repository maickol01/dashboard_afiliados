import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para las tablas de la base de datos
export interface Lider {
  id: string
  nombre: string
  clave_electoral?: string
  curp?: string
  direccion?: string
  colonia?: string
  codigo_postal?: string
  seccion?: string
  entidad?: string
  municipio?: string
  numero_cel?: string
  num_verificado: boolean
  verification_token?: string
  created_at: string
}

export interface Brigadista {
  id: string
  nombre: string
  lider_id: string
  clave_electoral?: string
  curp?: string
  direccion?: string
  colonia?: string
  codigo_postal?: string
  seccion?: string
  entidad?: string
  municipio?: string
  numero_cel?: string
  num_verificado: boolean
  verification_token?: string
  created_at: string
}

export interface Movilizador {
  id: string
  brigadista_id: string
  nombre: string
  clave_electoral: string
  curp: string
  direccion: string
  colonia: string
  codigo_postal?: string
  seccion?: string
  entidad?: string
  municipio?: string
  numero_cel?: string
  num_verificado: boolean
  verification_token?: string
  created_at: string
}

export interface Ciudadano {
  id: string
  nombre: string
  direccion: string
  clave_electoral: string
  curp: string
  colonia: string
  codigo_postal?: string
  seccion?: string
  entidad?: string
  municipio?: string
  numero_cel?: string
  num_verificado: boolean
  verification_token?: string
  created_at: string
  movilizador_id: string
}

export type Database = {
  public: {
    Tables: {
      lideres: {
        Row: Lider
        Insert: Omit<Lider, 'id' | 'created_at'>
        Update: Partial<Omit<Lider, 'id' | 'created_at'>>
      }
      brigadistas: {
        Row: Brigadista
        Insert: Omit<Brigadista, 'id' | 'created_at'>
        Update: Partial<Omit<Brigadista, 'id' | 'created_at'>>
      }
      movilizadores: {
        Row: Movilizador
        Insert: Omit<Movilizador, 'id' | 'created_at'>
        Update: Partial<Omit<Movilizador, 'id' | 'created_at'>>
      }
      ciudadanos: {
        Row: Ciudadano
        Insert: Omit<Ciudadano, 'id' | 'created_at'>
        Update: Partial<Omit<Ciudadano, 'id' | 'created_at'>>
      }
    }
  }
}