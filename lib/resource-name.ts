export class ResourceName {
  public readonly systemName: string
  public readonly systemEnv: string

  constructor(systemName: string, systemEnv: string) {
    this.systemName = systemName
    this.systemEnv = systemEnv
  }

  private basicName(name: string): string {
    return `${this.systemName}-${this.systemEnv}-${name}`
  }

  public bucketName(name: string): string {
    return this.basicName(name).toLowerCase()
  }

  public apiName(name: string): string {
    return this.basicName(`${name}-api`)
  }

  public cdnName(name: string): string {
    return this.basicName(`${name}-cdn`)
  }

  public lambdaName(name: string): string {
    return this.basicName(`${name}-function`)
  }

  public dynamodbName(name: string): string {
    return this.basicName(`${name}-table`)
  }

  public stackName(name: string): string {
    return this.basicName(`${name}-stack`)
  }
}
