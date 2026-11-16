import { Injectable } from '@angular/core';

export interface MenuItem {
  label: string;
  route: string;
  icon: string;
  /** La opción solo se marca activa con la ruta exacta (evita que /tienda quede activa en /tienda/pedidos). */
  exacta?: boolean;
}

export interface MenuSeccion {
  titulo: string;
  items: MenuItem[];
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private secciones: MenuSeccion[] = [
    {
      titulo: 'General',
      items: [{ label: 'Panel', route: '/dashboard', icon: 'dashboard' }]
    },
    {
      titulo: 'Cartera',
      items: [
        { label: 'Clientes', route: '/clientes', icon: 'clients' },
        { label: 'Préstamos', route: '/prestamos', icon: 'loans' },
        { label: 'Cuotas', route: '/pagos', icon: 'payments' }
      ]
    },
    {
      titulo: 'Cobranza',
      items: [
        { label: 'Cobradores', route: '/cobradores', icon: 'agents' },
        { label: 'Ruta de cobro', route: '/ruta', icon: 'route' },
        { label: 'Cuadre de caja', route: '/caja', icon: 'cash' }
      ]
    },
    {
      titulo: 'Inteligencia',
      items: [{ label: 'Scoring IA', route: '/scoring', icon: 'ai' }]
    }
  ];

  obtenerSecciones(): MenuSeccion[] {
    return this.secciones;
  }

  obtenerMenuItems(): MenuItem[] {
    return this.secciones.flatMap((s) => s.items);
  }
}
