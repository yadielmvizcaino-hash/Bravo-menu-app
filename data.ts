
import { Business, PlanType, BusinessType } from './types';

export const CUBA_PROVINCES = [
  "La Habana", "Santiago de Cuba", "Villa Clara", "Holguín", "Camagüey", 
  "Matanzas", "Artemisa", "Mayabeque", "Pinar del Río", "Cienfuegos", 
  "Sancti Spíritus", "Ciego de Ávila", "Las Tunas", "Granma", "Guantánamo", "Isla de la Juventud"
];

export const CUBA_MUNICIPALITIES_BY_PROVINCE: Record<string, string[]> = {
  "La Habana": ["Playa", "Plaza de la Revolución", "Centro Habana", "Habana Vieja", "Regla", "Habana del Este", "Guanabacoa", "San Miguel del Padrón", "Diez de Octubre", "Cerro", "Marianao", "La Lisa", "Boyeros", "Arroyo Naranjo", "Cotorro"],
  "Villa Clara": ["Santa Clara", "Sagua la Grande", "Placetas", "Caibarién", "Remedios", "Camajuaní", "Manicaragua", "Santo Domingo", "Corralillo", "Quemado de Güines", "Encrucijada", "Cifuentes"],
  "Santiago de Cuba": ["Santiago de Cuba", "Contramaestre", "Guamá", "Mella", "Palma Soriano", "San Luis", "Segundo Frente", "Songo - La Maya", "Tercer Frente"],
  "Holguín": ["Holguín", "Antilla", "Báguanos", "Banes", "Cacocum", "Calixto García", "Cueto", "Frank País", "Gibara", "Mayarí", "Moa", "Rafael Freyre", "Sagua de Tánamo", "Urbano Noris"],
  "Camagüey": ["Camagüey", "Carlos Manuel de Céspedes", "Esmeralda", "Florida", "Guáimaro", "Jimaguayú", "Minas", "Najasa", "Nuevitas", "Santa Cruz del Sur", "Sibanicú", "Sierra de Cubitas", "Vertientes"],
  "Matanzas": ["Matanzas", "Calimete", "Cárdenas", "Ciénaga de Zapata", "Colón", "Jagüey Grande", "Jovellanos", "Limonar", "Los Arabos", "Martí", "Pedro Betancourt", "Perico", "Unión de Reyes"],
  "Pinar del Río": ["Pinar del Río", "Consolación del Sur", "Guane", "La Palma", "Los Palacios", "Mantua", "Minas de Matahambre", "Sandino", "San Juan y Martínez", "San Luis", "Viñales"],
  "Artemisa": ["Artemisa", "Alquízar", "Bauta", "Caimito", "Guanajay", "Güira de Melena", "Mariel", "San Antonio de los Baños", "Bahía Honda", "San Cristóbal", "Candelaria"],
  "Mayabeque": ["San José de las Lajas", "Bejucal", "Jaruco", "Santa Cruz del Norte", "Madruga", "Nueva Paz", "San Nicolás", "Güines", "Melena del Sur", "Batabanó", "Quivicán"],
  "Cienfuegos": ["Cienfuegos", "Abreus", "Aguada de Pasajeros", "Cruces", "Lajas", "Palmira", "Rodas", "Santa Isabel de las Lajas"],
  "Sancti Spíritus": ["Sancti Spíritus", "Cabaiguán", "Fomento", "Jatibonico", "La Sierpe", "Taguasco", "Trinidad", "Yaguajay"],
  "Ciego de Ávila": ["Ciego de Ávila", "Baraguá", "Bolivia", "Chambas", "Florencia", "Majagua", "Morón", "Primero de Enero", "Venezuela", "Ciro Redondo"],
  "Las Tunas": ["Las Tunas", "Amancio", "Colombia", "Jesús Menéndez", "Jobabo", "Majibacoa", "Puerto Padre", "Manatí"],
  "Granma": ["Bayamo", "Bartolomé Masó", "Buey Arriba", "Campechuela", "Cauto Cristo", "Guisa", "Jiguaní", "Manzanillo", "Media Luna", "Niquero", "Pilón", "Río Cauto", "Yara"],
  "Guantánamo": ["Guantánamo", "Baracoa", "Caimanera", "El Salvador", "Imías", "Maisí", "Manuel Tames", "Niceto Pérez", "San Antonio del Sur", "Yateras"],
  "Isla de la Juventud": ["Nueva Gerona"]
};

export const MOCK_BUSINESSES: Business[] = [];
