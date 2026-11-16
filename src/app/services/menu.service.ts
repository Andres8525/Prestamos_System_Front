import { Injectable } from '@angular/core';

export interface MenuItem {
  label: string;
  route: string;
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private menuItems: MenuItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Clientes',  route: '/clientes',  icon: 'clients'   },
    { label: 'Préstamos', route: '/prestamos', icon: 'loans'     },
    { label: 'Cuotas',    route: '/pagos',     icon: 'payments'  },
    { label: 'Cobradores', route: '/cobradores', icon: 'agents'  },
    { label: 'Ruta de cobro', route: '/ruta',  icon: 'route'     },
    { label: 'Cuadre de caja', route: '/caja', icon: 'cash'      },
    { label: 'Scoring IA', route: '/scoring',  icon: 'ai'        }
  ];

  obtenerMenuItems(): MenuItem[] {
    return this.menuItems;
  }
}
