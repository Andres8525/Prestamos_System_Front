import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuService, MenuSeccion } from '../../services/menu.service';
import { MenuItemComponent } from '../menu-item/menu-item.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-nav-menu',
  standalone: true,
  imports: [CommonModule, MenuItemComponent],
  templateUrl: './nav-menu.component.html',
  styleUrls: ['./nav-menu.component.css']
})
export class NavMenuComponent implements OnInit {
  @Output() collapsedChange = new EventEmitter<boolean>();
  /** Se emite al elegir una opción (para cerrar el menú en móviles). */
  @Output() navegar = new EventEmitter<void>();

  secciones: MenuSeccion[] = [];
  isCollapsed = false;

  constructor(private menuService: MenuService, private auth: AuthService) {}

  ngOnInit(): void {
    this.secciones = this.menuService.obtenerSecciones();
  }

  toggle(): void {
    this.isCollapsed = !this.isCollapsed;
    this.collapsedChange.emit(this.isCollapsed);
  }

  cerrarSesion(): void {
    this.auth.cerrarSesion();
  }
}
