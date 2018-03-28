const commonReg = new RegExp('\\.((test|sit|uat)\\.)?(ffan|tasicc\\.(net|com))')

function getDomainEnv(url = location.host, reg = commonReg) {
  const host = url || location.host
  const domainTestResult = host.match(reg)
  return domainTestResult ? (domainTestResult[2] ? domainTestResult[2] : 'pub') : 'local'
}

function getReplaced(match) {
  switch (match) {
    case 'local':
      return 'sit.'
    case 'sit':
      return 'sit.'
    case 'uat':
      return 'uat.'
    case 'test':
      return 'test.'
    case 'pub':
      return ''
    default:
      throw new Error('not matched')
  }
}

const fixDomain = (url = '', host = location.host, reg = commonReg) => {
  const matches = url.match(reg)
  if (!Array.isArray(matches)) {
    throw Error('-- url not matched! --')
  }
  return url.replace(matches[0], `.${getReplaced(getDomainEnv(host))}${matches[3]}`)
}

module.exports = {
  getDomainEnv,
  fixDomain,
}
