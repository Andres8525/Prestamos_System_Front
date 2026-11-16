import { celdaCsv, generarCsv } from './csv';

describe('generarCsv (worker de exportación)', () => {
  it('escapa comas, comillas y saltos de línea según RFC 4180', () => {
    expect(celdaCsv('Pérez, Ana')).toBe('"Pérez, Ana"');
    expect(celdaCsv('Dice "hola"')).toBe('"Dice ""hola"""');
    expect(celdaCsv('línea1\nlínea2')).toBe('"línea1\nlínea2"');
    expect(celdaCsv(null)).toBe('');
    expect(celdaCsv(12.5)).toBe('12.5');
  });

  it('arma cabecera y filas con BOM para Excel', () => {
    const csv = generarCsv({
      columnas: [{ clave: 'id', titulo: 'ID' }, { clave: 'nombre', titulo: 'Nombre' }],
      filas: [{ id: 1, nombre: 'Ana' }, { id: 2 }]
    });
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv.slice(1).split('\r\n')).toEqual(['ID,Nombre', '1,Ana', '2,', '']);
  });
});
