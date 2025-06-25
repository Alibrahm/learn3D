export const isUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
  return uuidRegex.test(str)
}

export const generateUUID = (): string => {
  return crypto.randomUUID()
}

export const validateUUID = (uuid: string): void => {
  if (!isUUID(uuid)) {
    throw new Error(`Invalid UUID: ${uuid}`)
  }
}
