# SIQAL

[![CI/CD SIQAL Pipeline](https://github.com/SaulFnck/SIQAL/actions/workflows/ci.yml/badge.svg)](https://github.com/SaulFnck/SIQAL/actions/workflows/ci.yml)

Sistema de Quejas y Alertas de ODS8 (SIQAL).

## Estructura del Proyecto

El proyecto está dividido en dos partes principales:

- **[BACKEND](file:///c:/Users/sauld/OneDrive/Documentos/Universidad/SIQAL/BACKEND)**: API desarrollada en Node.js, Express y TypeScript, conectada a una base de datos MongoDB (Mongoose).
- **[FRONTEND](file:///c:/Users/sauld/OneDrive/Documentos/Universidad/SIQAL/FRONTEND)**: Aplicación web de interfaz de usuario.

## Pipeline de Integración Continua (CI/CD)

El pipeline de GitHub Actions realiza las siguientes tareas:
- Descarga el código y configura Node.js.
- Instala las dependencias y valida los tipos de TypeScript.
- Compila el proyecto Backend para asegurar que no haya errores de compilación.
