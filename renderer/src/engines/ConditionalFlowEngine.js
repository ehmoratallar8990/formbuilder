/**
 * ConditionalFlowEngine
 * Pure DAG evaluator. No side effects. No DOM access.
 * Shared between CMS previewer and Lit renderer.
 *
 * @param {Object} formJson  - form_json object with nodes[] and edges[]
 * @param {Object} values    - { [nodeId]: value } current field values
 * @returns {Set<string>}     Set of visible node IDs
 */
export function evaluateVisibility(formJson, values = {}) {
  const { nodes = [], edges = [] } = formJson

  // Build adjacency: target → [edge conditions from sources]
  const targetConditions = new Map()
  for (const edge of edges) {
    if (!edge.condition) continue
    if (!targetConditions.has(edge.target_node_id)) {
      targetConditions.set(edge.target_node_id, [])
    }
    targetConditions.get(edge.target_node_id).push({
      sourceNodeId: edge.source_node_id,
      condition: edge.condition
    })
  }

  const visible = new Set()
  for (const node of nodes) {
    const conditions = targetConditions.get(node.id)
    if (!conditions || conditions.length === 0) {
      // No incoming condition edges → always visible
      visible.add(node.id)
      continue
    }
    // Node visible if ALL incoming conditions pass (AND logic)
    const allPass = conditions.every(({ sourceNodeId, condition }) => {
      const sourceValue = values[sourceNodeId]
      return evaluateCondition(condition, sourceValue)
    })
    if (allPass) visible.add(node.id)
  }

  return visible
}

/**
 * @param {Object} condition - { operator, value }
 * @param {*} fieldValue
 * @returns {boolean}
 */
function evaluateCondition(condition, fieldValue) {
  const { operator, value } = condition
  switch (operator) {
    case 'eq':          return String(fieldValue) === String(value)
    case 'neq':         return String(fieldValue) !== String(value)
    case 'gt':          return Number(fieldValue) > Number(value)
    case 'lt':          return Number(fieldValue) < Number(value)
    case 'gte':         return Number(fieldValue) >= Number(value)
    case 'lte':         return Number(fieldValue) <= Number(value)
    case 'contains':    return String(fieldValue).includes(String(value))
    case 'not_contains':return !String(fieldValue).includes(String(value))
    case 'is_empty':    return !fieldValue || String(fieldValue).trim() === ''
    case 'is_not_empty':return !!(fieldValue && String(fieldValue).trim() !== '')
    case 'in':          return Array.isArray(value) && value.includes(fieldValue)
    case 'not_in':      return Array.isArray(value) && !value.includes(fieldValue)
    default:            return true
  }
}

/**
 * Detect cycles in DAG using DFS.
 * @param {Array} edges - edge list [{ source_node_id, target_node_id }]
 * @returns {boolean} true if cycle detected
 */
export function hasCycle(edges) {
  const adj = new Map()
  for (const edge of edges) {
    if (!adj.has(edge.source_node_id)) adj.set(edge.source_node_id, [])
    adj.get(edge.source_node_id).push(edge.target_node_id)
  }

  const visited = new Set()
  const inStack = new Set()

  function dfs(node) {
    if (inStack.has(node)) return true
    if (visited.has(node)) return false
    visited.add(node)
    inStack.add(node)
    for (const neighbor of (adj.get(node) || [])) {
      if (dfs(neighbor)) return true
    }
    inStack.delete(node)
    return false
  }

  for (const node of adj.keys()) {
    if (dfs(node)) return true
  }
  return false
}
