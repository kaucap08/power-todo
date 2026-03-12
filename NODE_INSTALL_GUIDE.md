# 📋 Guia de Instalação do Node.js no Windows

## 🔍 Verificar se o Node.js está instalado

Abra o PowerShell ou CMD e execute:
```bash
node --version
npm --version
```

Se aparecer "comando não encontrado", siga os passos abaixo.

## 🚀 Instalação do Node.js

### Método 1: Download Oficial (Recomendado)

1. **Acesse o site oficial**: https://nodejs.org/
2. **Baixe a versão LTS** (Long Term Support) - é a mais estável
3. **Execute o instalador** (.msi)
4. **Siga o wizard**:
   - Aceite os termos
   - Mantenha as opções padrão (inclui npm)
   - Marque "Add to PATH" (importante!)
5. **Reinicie o PowerShell/CMD**

### Método 2: Via Chocolatey (se tiver)

```bash
# Instalar o Chocolatey (se não tiver)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar Node.js
choco install nodejs --version=18.17.0
```

### Método 3: Via Winget (Windows 11)

```bash
winget install OpenJS.NodeJS
```

## ✅ Verificar Instalação

Após instalar, **abra um NOVO** PowerShell/CMD e teste:

```bash
node --version
# Deve mostrar algo como: v18.17.0

npm --version  
# Deve mostrar algo como: 9.6.7
```

## 🔧 Se ainda não funcionar (PATH)

Se os comandos ainda não forem reconhecidos:

1. **Encontre o caminho do Node.js**:
   - Geralmente: `C:\Program Files\nodejs\`

2. **Adicione ao PATH do Windows**:
   - Pressione `Win + X` → "Sistema"
   - "Configurações avançadas do sistema"
   - "Variáveis de ambiente"
   - Em "Variáveis do sistema", edite "Path"
   - Adicione: `C:\Program Files\nodejs\`

3. **Reinicie o terminal**

## 📦 Instalando o Framer Motion

Com o Node.js funcionando:

```bash
cd "c:\Users\pains\OneDrive\Documentos\TO-DO\frontend"
npm install framer-motion
```

## 🎯 Testando o PowerOS

Após instalar as dependências:

```bash
npm start
```

O app deve abrir em `http://localhost:3000`

## ⚠️ Solução de Problemas Comuns

### "npm não é reconhecido"
- Reinicie o PowerShell/CMD após a instalação
- Verifique se o Node.js está no PATH

### "Erro de permissão"
- Execute o PowerShell como Administrador
- Ou use o CMD

### "Porta 3000 em uso"
```bash
# Use outra porta
npm start -- --port=3001
```

### "Erro de módulo"
```bash
# Limpe e reinstale
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📈 Versões Recomendadas

- **Node.js**: 18.x ou 20.x (LTS)
- **npm**: 9.x ou superior
- **React**: 19.x (já configurado)

---

**Pronto!** Após seguir estes passos, seu PowerOS com Assistente Inteligente estará funcionando perfeitamente! 🚀

Se ainda tiver problemas, reinicie o computador após a instalação do Node.js.
