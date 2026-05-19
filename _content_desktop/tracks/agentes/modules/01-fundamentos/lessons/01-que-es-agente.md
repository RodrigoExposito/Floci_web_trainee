# ¿Qué es un Agente de IA?

Un **agente de IA** es un sistema que percibe su entorno, razona sobre él y toma acciones para alcanzar un objetivo. A diferencia de un chatbot simple que responde en turnos fijos, un agente puede encadenar múltiples pasos, decidir qué herramienta usar y adaptar su plan en función de los resultados intermedios.

## La diferencia con una cadena simple

Una cadena (chain) ejecuta siempre los mismos pasos en el mismo orden: `entrada → paso 1 → paso 2 → salida`. No importa lo que responda el usuario, el flujo es fijo.

Un agente, en cambio, usa un LLM como motor de razonamiento para decidir **qué hacer a continuación**. El ciclo es:

1. **Percibir** — recibe una tarea o mensaje.
2. **Razonar** — el LLM analiza el estado actual y elige la siguiente acción.
3. **Actuar** — ejecuta la acción (llamar una tool, generar texto, almacenar en memoria…).
4. **Observar** — incorpora el resultado de la acción al contexto.
5. **Repetir** — hasta que el objetivo está cumplido o se alcanza un límite.

Este patrón se conoce como **ReAct** (Reason + Act).

## ¿Cuándo usar un agente?

Usá un agente cuando la tarea requiere:

- **Pasos variables**: no sabés de antemano cuántos pasos tomará.
- **Decisiones condicionales**: el siguiente paso depende del resultado del anterior.
- **Múltiples herramientas**: buscar en la web, consultar una DB, enviar emails…
- **Bucles de refinamiento**: el agente prueba, evalúa y corrige hasta obtener una buena respuesta.

No uses un agente si la tarea es determinista y de un solo paso. El overhead no vale la pena.

## Autonomía y riesgo

Mayor autonomía implica mayor riesgo de errores acumulados. Un agente que ejecuta código sin supervisión puede romper cosas. El diseño de producción incluye siempre:

- **Límite de iteraciones** para evitar bucles infinitos.
- **Human-in-the-loop** para acciones irreversibles.
- **Logging estructurado** para auditoría de cada paso.

## Frameworks populares

| Framework | Enfoque |
|-----------|---------|
| LangGraph | Grafos de estado, control explícito del flujo |
| LangChain Agents | ReAct y Tool Calling sobre LLMs |
| CrewAI | Multi-agente con roles y colaboración |
| AutoGen | Conversaciones multi-agente con código |

En este track usarás Python puro para entender los fundamentos antes de incorporar un framework.
