// ================================================================================
// SISPRE v2.0 - MÓDULO DE ANÁLISE REVERSA
// ================================================================================
// Este arquivo contém a nova funcionalidade de Análise Reversa
// que permite simular cenários a partir de um preço de venda já definido
// ================================================================================

// Armazenamento de cenários
var cenarios = [];
var cenarioAtual = null;

// Inicializar análise
function inicializarAnalise() {
    cenarios = [{
        id: 1,
        nome: "Situação Atual",
        precoVenda: 0,
        custo: 0,
        descontoMarketplace: 0,
        coParticipacao: 0,
        gastosExtras: [],
        resultado: null,
        empresaId: null,
        marketplaceId: null,
        freteParaImposto: 0,
        freteParaComissao: 0
    }];
    
    atualizarListaCenarios();
}

// Adicionar novo cenário
function adicionarCenario() {
    var ultimoCenario = cenarios[cenarios.length - 1];
    var novoCenario = {
        id: Date.now(),
        nome: "Cenário " + (cenarios.length + 1),
        precoVenda: ultimoCenario.precoVenda,
        custo: ultimoCenario.custo,
        descontoMarketplace: 0,
        coParticipacao: 0,
        gastosExtras: [],
        resultado: null,
        empresaId: ultimoCenario.empresaId,
        marketplaceId: ultimoCenario.marketplaceId,
        freteParaImposto: ultimoCenario.freteParaImposto,
        freteParaComissao: ultimoCenario.freteParaComissao
    };
    
    cenarios.push(novoCenario);
    atualizarListaCenarios();
}

// Duplicar cenário
function duplicarCenario(id) {
    var cenario = encontrarCenario(id);
    if (!cenario) return;
    
    var novoCenario = JSON.parse(JSON.stringify(cenario));
    novoCenario.id = Date.now();
    novoCenario.nome = cenario.nome + " (Cópia)";
    
    cenarios.push(novoCenario);
    atualizarListaCenarios();
}

// Remover cenário
function removerCenario(id) {
    if (cenarios.length <= 1) {
        alert("Você precisa manter pelo menos um cenário!");
        return;
    }
    
    if (!confirm("Tem certeza que deseja remover este cenário?")) return;
    
    for (var i = 0; i < cenarios.length; i++) {
        if (cenarios[i].id === id) {
            cenarios.splice(i, 1);
            break;
        }
    }
    
    atualizarListaCenarios();
}

// Encontrar cenário por ID
function encontrarCenario(id) {
    for (var i = 0; i < cenarios.length; i++) {
        if (cenarios[i].id == id) return cenarios[i];
    }
    return null;
}

// Calcular cenário (análise reversa)
function calcularCenarioReverso(cenario) {
    if (!cenario.precoVenda || cenario.precoVenda <= 0) return null;
    if (!cenario.custo || cenario.custo <= 0) return null;
    if (!cenario.empresaId || !cenario.marketplaceId) return null;
    
    var precoVenda = parseFloat(cenario.precoVenda);
    var custo = parseFloat(cenario.custo);
    var descontoMarketplace = parseFloat(cenario.descontoMarketplace) || 0;
    var coParticipacao = parseFloat(cenario.coParticipacao) || 0;
    var freteImposto = parseFloat(cenario.freteParaImposto) || 0;
    var freteComissao = parseFloat(cenario.freteParaComissao) || 0;
    
    // Calcular preço final que cliente paga
    var valorDescontoTotal = precoVenda * (descontoMarketplace / 100);
    var precoFinalCliente = precoVenda - valorDescontoTotal;
    
    // Calcular co-participação do vendedor
    var valorCoParticipacao = precoFinalCliente * (coParticipacao / 100);
    
    // Buscar empresa e marketplace
    var empresa = encontrarEmpresa(cenario.empresaId);
    var marketplace = encontrarMarketplace(cenario.marketplaceId);
    
    if (!empresa || !marketplace) return null;
    
    // Calcular custos
    var impostoPercentual = empresa.impostoPercentual || 0;
    var comissaoPercentual = marketplace.comissaoPercentual || 0;
    
    var gastosDetalhados = [];
    var totalCustos = custo;
    
    // Impostos sobre produto
    var impostoSobreProduto = (precoFinalCliente * impostoPercentual) / 100;
    totalCustos += impostoSobreProduto;
    gastosDetalhados.push({
        nome: 'Impostos sobre Produto (' + impostoPercentual.toFixed(1) + '%)',
        valor: impostoSobreProduto,
        categoria: 'empresa'
    });
    
    // Comissão sobre produto
    var comissaoSobreProduto = (precoFinalCliente * comissaoPercentual) / 100;
    totalCustos += comissaoSobreProduto;
    gastosDetalhados.push({
        nome: 'Comissão sobre Produto (' + comissaoPercentual.toFixed(1) + '%)',
        valor: comissaoSobreProduto,
        categoria: 'marketplace'
    });
    
    // Custos da empresa
    for (var i = 0; i < empresa.custosFixos.length; i++) {
        var custoEmp = empresa.custosFixos[i];
        var valorCusto = parseFloat(custoEmp.valor) || 0;
        var valorCalculado = 0;
        
        if (custoEmp.tipo === 'fixo') {
            valorCalculado = valorCusto;
        } else {
            var baseCalculo = precoFinalCliente + freteImposto;
            valorCalculado = (baseCalculo * valorCusto) / 100;
        }
        
        totalCustos += valorCalculado;
        gastosDetalhados.push({
            nome: custoEmp.nome + ' (Empresa)',
            valor: valorCalculado,
            categoria: 'empresa'
        });
    }
    
    // Custos do marketplace
    for (var i = 0; i < marketplace.custosFixos.length; i++) {
        var custoMkt = marketplace.custosFixos[i];
        var valorCusto = parseFloat(custoMkt.valor) || 0;
        var valorCalculado = 0;
        
        if (custoMkt.tipo === 'fixo') {
            valorCalculado = valorCusto;
        } else {
            var baseCalculo = precoFinalCliente + freteComissao;
            valorCalculado = (baseCalculo * valorCusto) / 100;
        }
        
        totalCustos += valorCalculado;
        gastosDetalhados.push({
            nome: custoMkt.nome + ' (Marketplace)',
            valor: valorCalculado,
            categoria: 'marketplace'
        });
    }
    
    // Impostos e comissões sobre frete
    if (freteImposto > 0 && impostoPercentual > 0) {
        var impostoFrete = (freteImposto * impostoPercentual) / 100;
        totalCustos += impostoFrete;
        gastosDetalhados.push({
            nome: 'Impostos sobre Frete',
            valor: impostoFrete,
            categoria: 'frete'
        });
    }
    
    if (freteComissao > 0 && comissaoPercentual > 0) {
        var comissaoFrete = (freteComissao * comissaoPercentual) / 100;
        totalCustos += comissaoFrete;
        gastosDetalhados.push({
            nome: 'Comissão sobre Frete',
            valor: comissaoFrete,
            categoria: 'frete'
        });
    }
    
    // Gastos extras do cenário
    for (var i = 0; i < cenario.gastosExtras.length; i++) {
        var gasto = cenario.gastosExtras[i];
        var valorGasto = parseFloat(gasto.valor) || 0;
        var valorCalculado = 0;
        
        if (gasto.tipo === 'fixo') {
            valorCalculado = valorGasto;
        } else {
            valorCalculado = (precoFinalCliente * valorGasto) / 100;
        }
        
        totalCustos += valorCalculado;
        gastosDetalhados.push({
            nome: gasto.nome + ' (Extra)',
            valor: valorCalculado,
            categoria: 'extra'
        });
    }
    
    // Adicionar co-participação como custo
    if (valorCoParticipacao > 0) {
        totalCustos += valorCoParticipacao;
        gastosDetalhados.push({
            nome: 'Co-participação em Desconto (' + coParticipacao.toFixed(1) + '%)',
            valor: valorCoParticipacao,
            categoria: 'desconto'
        });
    }
    
    // Calcular lucro e margens
    var lucroLiquido = precoFinalCliente - totalCustos;
    var margemSobreVenda = (lucroLiquido / precoFinalCliente) * 100;
    var margemSobreCusto = (lucroLiquido / custo) * 100;
    
    // Determinar alerta
    var alerta = gerarAlerta(margemSobreVenda, lucroLiquido);
    
    return {
        precoVenda: precoVenda,
        precoFinalCliente: precoFinalCliente,
        valorDescontoTotal: valorDescontoTotal,
        valorCoParticipacao: valorCoParticipacao,
        custo: custo,
        totalCustos: totalCustos,
        lucroLiquido: lucroLiquido,
        margemSobreVenda: margemSobreVenda,
        margemSobreCusto: margemSobreCusto,
        gastosDetalhados: gastosDetalhados,
        alerta: alerta
    };
}

// Gerar alerta baseado na margem
function gerarAlerta(margem, lucro) {
    if (lucro < 0) {
        return {
            tipo: 'critico',
            icone: '❌',
            titulo: 'PREJUÍZO!',
            mensagem: 'Você terá prejuízo de R$ ' + Math.abs(lucro).toFixed(2) + ' nesta venda',
            cor: '#dc2626'
        };
    } else if (margem < 0) {
        return {
            tipo: 'critico',
            icone: '❌',
            titulo: 'PREJUÍZO',
            mensagem: 'Margem negativa! Você perderá dinheiro nesta venda',
            cor: '#dc2626'
        };
    } else if (margem < 3) {
        return {
            tipo: 'ruim',
            icone: '❌',
            titulo: 'MARGEM MUITO BAIXA',
            mensagem: 'Margem abaixo de 3%. Alto risco de prejuízo',
            cor: '#dc2626'
        };
    } else if (margem < 7) {
        return {
            tipo: 'atencao',
            icone: '⚠️',
            titulo: 'ATENÇÃO',
            mensagem: 'Margem baixa. Avalie se vale a pena',
            cor: '#f59e0b'
        };
    } else if (margem < 10) {
        return {
            tipo: 'medio',
            icone: '⚠️',
            titulo: 'MARGEM ACEITÁVEL',
            mensagem: 'Margem moderada, mas abaixo do ideal',
            cor: '#eab308'
        };
    } else {
        return {
            tipo: 'bom',
            icone: '✓',
            titulo: 'MARGEM SAUDÁVEL',
            mensagem: 'Boa margem para participar',
            cor: '#16a34a'
        };
    }
}

// Atualizar lista de cenários na interface
function atualizarListaCenarios() {
    var container = document.getElementById('listaCenarios');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (var i = 0; i < cenarios.length; i++) {
        var cenario = cenarios[i];
        var resultado = cenario.resultado;
        
        var html = '<div class="cenario-card" id="cenario-' + cenario.id + '">';
        html += '<div class="cenario-header">';
        html += '<input type="text" value="' + cenario.nome + '" onchange="atualizarNomeCenario(' + cenario.id + ', this.value)" class="input-nome-cenario">';
        html += '<div class="cenario-acoes">';
        html += '<button onclick="duplicarCenario(' + cenario.id + ')" class="btn btn-sm btn-gray">📋 Duplicar</button>';
        if (cenarios.length > 1) {
            html += '<button onclick="removerCenario(' + cenario.id + ')" class="btn btn-sm btn-red">🗑️ Remover</button>';
        }
        html += '</div>';
        html += '</div>';
        
        // Formulário do cenário
        html += '<div class="cenario-form">';
        html += '<div class="form-row">';
        html += '<div class="form-group">';
        html += '<label>Desconto Marketplace (%)</label>';
        html += '<input type="number" step="0.01" value="' + cenario.descontoMarketplace + '" onchange="atualizarCenario(' + cenario.id + ', \'descontoMarketplace\', this.value)" class="input-small">';
        html += '</div>';
        html += '<div class="form-group">';
        html += '<label>Co-participação (%)</label>';
        html += '<input type="number" step="0.01" value="' + cenario.coParticipacao + '" onchange="atualizarCenario(' + cenario.id + ', \'coParticipacao\', this.value)" class="input-small">';
        html += '</div>';
        html += '</div>';
        html += '<button onclick="calcularCenario(' + cenario.id + ')" class="btn btn-blue" style="width: 100%; margin-top: 0.5rem;">🧮 Calcular Cenário</button>';
        html += '</div>';
        
        // Resultado
        if (resultado) {
            var alerta = resultado.alerta;
            html += '<div class="cenario-resultado" style="border-left: 4px solid ' + alerta.cor + ';">';
            html += '<div class="alerta-header" style="background: ' + alerta.cor + '20; color: ' + alerta.cor + ';">';
            html += '<span style="font-size: 1.5rem;">' + alerta.icone + '</span>';
            html += '<strong>' + alerta.titulo + '</strong>';
            html += '</div>';
            html += '<div class="resultado-resumo">';
            html += '<div>Cliente Paga: <strong>R$ ' + resultado.precoFinalCliente.toFixed(2) + '</strong></div>';
            html += '<div>Lucro: <strong style="color: ' + (resultado.lucroLiquido >= 0 ? '#16a34a' : '#dc2626') + ';">R$ ' + resultado.lucroLiquido.toFixed(2) + '</strong></div>';
            html += '<div>Margem: <strong>' + resultado.margemSobreVenda.toFixed(2) + '%</strong></div>';
            html += '</div>';
            html += '<p style="margin: 0.5rem 0 0 0; font-size: 0.875rem; color: ' + alerta.cor + ';"><strong>' + alerta.mensagem + '</strong></p>';
            html += '<button onclick="verDetalhamentoCenario(' + cenario.id + ')" class="btn btn-sm btn-gray" style="width: 100%; margin-top: 0.5rem;">👁️ Ver Detalhamento Completo</button>';
            html += '</div>';
        }
        
        html += '</div>';
        
        container.innerHTML += html;
    }
}

// Atualizar nome do cenário
function atualizarNomeCenario(id, nome) {
    var cenario = encontrarCenario(id);
    if (cenario) {
        cenario.nome = nome;
    }
}

// Atualizar campo do cenário
function atualizarCenario(id, campo, valor) {
    var cenario = encontrarCenario(id);
    if (cenario) {
        cenario[campo] = parseFloat(valor) || 0;
    }
}

// Calcular um cenário específico
function calcularCenario(id) {
    var cenario = encontrarCenario(id);
    if (!cenario) return;
    
    var resultado = calcularCenarioReverso(cenario);
    if (resultado) {
        cenario.resultado = resultado;
        atualizarListaCenarios();
        atualizarComparacao();
    } else {
        alert('Preencha todos os campos obrigatórios (Preço de Venda, Custo, Empresa e Marketplace)');
    }
}

// Calcular todos os cenários
function calcularTodosCenarios() {
    var calculados = 0;
    
    for (var i = 0; i < cenarios.length; i++) {
        var cenario = cenarios[i];
        var resultado = calcularCenarioReverso(cenario);
        if (resultado) {
            cenario.resultado = resultado;
            calculados++;
        }
    }
    
    if (calculados > 0) {
        atualizarListaCenarios();
        atualizarComparacao();
        alert('✅ ' + calculados + ' cenário(s) calculado(s) com sucesso!');
    } else {
        alert('⚠️ Nenhum cenário pôde ser calculado. Verifique se todos os campos estão preenchidos.');
    }
}

// Atualizar comparação entre cenários
function atualizarComparacao() {
    var container = document.getElementById('tabelaComparacao');
    if (!container) return;
    
    // Filtrar apenas cenários com resultado
    var cenariosComResultado = [];
    for (var i = 0; i < cenarios.length; i++) {
        if (cenarios[i].resultado) {
            cenariosComResultado.push(cenarios[i]);
        }
    }
    
    if (cenariosComResultado.length === 0) {
        container.innerHTML = '<div class="text-center text-gray" style="padding: 2rem;">Calcule os cenários para ver a comparação</div>';
        return;
    }
    
    var html = '<div style="overflow-x: auto;">';
    html += '<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">';
    
    // Cabeçalho
    html += '<thead style="background: #f9fafb;">';
    html += '<tr>';
    html += '<th style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: left;">Cenário</th>';
    html += '<th style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: right;">Cliente Paga</th>';
    html += '<th style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: right;">Lucro</th>';
    html += '<th style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: right;">Margem %</th>';
    html += '<th style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: center;">Status</th>';
    html += '</tr>';
    html += '</thead>';
    
    // Dados
    html += '<tbody>';
    for (var i = 0; i < cenariosComResultado.length; i++) {
        var cenario = cenariosComResultado[i];
        var resultado = cenario.resultado;
        var alerta = resultado.alerta;
        
        html += '<tr>';
        html += '<td style="padding: 0.75rem; border: 1px solid #e5e7eb;"><strong>' + cenario.nome + '</strong></td>';
        html += '<td style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: right;">R$ ' + resultado.precoFinalCliente.toFixed(2) + '</td>';
        html += '<td style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: right; color: ' + (resultado.lucroLiquido >= 0 ? '#16a34a' : '#dc2626') + ';"><strong>R$ ' + resultado.lucroLiquido.toFixed(2) + '</strong></td>';
        html += '<td style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: right;"><strong>' + resultado.margemSobreVenda.toFixed(1) + '%</strong></td>';
        html += '<td style="padding: 0.75rem; border: 1px solid #e5e7eb; text-align: center;"><span style="background: ' + alerta.cor + '20; color: ' + alerta.cor + '; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 600;">' + alerta.icone + ' ' + alerta.tipo.toUpperCase() + '</span></td>';
        html += '</tr>';
    }
    html += '</tbody>';
    html += '</table>';
    html += '</div>';
    
    container.innerHTML = html;
}

// Ver detalhamento de um cenário
function verDetalhamentoCenario(id) {
    var cenario = encontrarCenario(id);
    if (!cenario || !cenario.resultado) return;
    
    var resultado = cenario.resultado;
    var alerta = resultado.alerta;
    
    var html = '<div style="max-width: 800px; margin: 0 auto;">';
    html += '<h3 style="margin-bottom: 1rem;">📊 Detalhamento: ' + cenario.nome + '</h3>';
    
    // Status
    html += '<div class="alerta-header" style="background: ' + alerta.cor + '20; color: ' + alerta.cor + '; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid ' + alerta.cor + ';">';
    html += '<div style="display: flex; align-items: center; gap: 0.5rem;">';
    html += '<span style="font-size: 2rem;">' + alerta.icone + '</span>';
    html += '<div>';
    html += '<div style="font-weight: 700; font-size: 1.125rem;">' + alerta.titulo + '</div>';
    html += '<div style="font-size: 0.875rem;">' + alerta.mensagem + '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    
    // Valores principais
    html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">';
    html += '<div style="background: #f9fafb; padding: 1rem; border-radius: 8px;">';
    html += '<div style="color: #6b7280; font-size: 0.875rem;">Preço de Venda</div>';
    html += '<div style="font-size: 1.5rem; font-weight: 700;">R$ ' + resultado.precoVenda.toFixed(2) + '</div>';
    if (resultado.valorDescontoTotal > 0) {
        html += '<div style="color: #f59e0b; font-size: 0.875rem;">Desconto: R$ ' + resultado.valorDescontoTotal.toFixed(2) + '</div>';
    }
    html += '</div>';
    html += '<div style="background: #f0fdf4; padding: 1rem; border-radius: 8px;">';
    html += '<div style="color: #16a34a; font-size: 0.875rem;">Cliente Paga</div>';
    html += '<div style="font-size: 1.5rem; font-weight: 700; color: #16a34a;">R$ ' + resultado.precoFinalCliente.toFixed(2) + '</div>';
    html += '</div>';
    html += '</div>';
    
    // Breakdown de custos
    html += '<div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">';
    html += '<h4 style="margin: 0 0 0.75rem 0;">💰 Breakdown de Custos</h4>';
    html += '<div style="display: grid; gap: 0.5rem;">';
    html += '<div style="display: flex; justify-content: space-between; padding: 0.5rem; background: #f9fafb; border-radius: 4px;">';
    html += '<span>Custo Base:</span><strong>R$ ' + resultado.custo.toFixed(2) + '</strong>';
    html += '</div>';
    
    for (var i = 0; i < resultado.gastosDetalhados.length; i++) {
        var gasto = resultado.gastosDetalhados[i];
        html += '<div style="display: flex; justify-content: space-between; padding: 0.5rem; background: #f9fafb; border-radius: 4px;">';
        html += '<span>' + gasto.nome + ':</span><strong>R$ ' + gasto.valor.toFixed(2) + '</strong>';
        html += '</div>';
    }
    
    html += '<div style="display: flex; justify-content: space-between; padding: 0.75rem; background: #f3f4f6; border-radius: 4px; border-top: 2px solid #e5e7eb; margin-top: 0.5rem;">';
    html += '<span><strong>Total de Custos:</strong></span><strong style="color: #dc2626;">R$ ' + resultado.totalCustos.toFixed(2) + '</strong>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    
    // Lucro e margens
    html += '<div style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(21, 128, 61, 0.1) 100%); border: 2px solid rgba(34, 197, 94, 0.3); border-radius: 8px; padding: 1rem;">';
    html += '<h4 style="margin: 0 0 0.75rem 0; color: #15803d;">💰 Lucro Final</h4>';
    html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">';
    html += '<div>';
    html += '<div style="color: #15803d; font-size: 0.875rem;">Lucro Líquido</div>';
    html += '<div style="font-size: 1.75rem; font-weight: 800; color: ' + (resultado.lucroLiquido >= 0 ? '#15803d' : '#dc2626') + ';">R$ ' + resultado.lucroLiquido.toFixed(2) + '</div>';
    html += '</div>';
    html += '<div>';
    html += '<div style="color: #15803d; font-size: 0.875rem;">Margem sobre Venda</div>';
    html += '<div style="font-size: 1.75rem; font-weight: 800; color: #15803d;">' + resultado.margemSobreVenda.toFixed(2) + '%</div>';
    html += '</div>';
    html += '</div>';
    html += '<div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(34, 197, 94, 0.3);">';
    html += '<div style="color: #15803d; font-size: 0.875rem;">Margem sobre Custo (referência)</div>';
    html += '<div style="font-size: 1.25rem; font-weight: 700; color: #15803d;">' + resultado.margemSobreCusto.toFixed(2) + '%</div>';
    html += '</div>';
    html += '</div>';
    
    html += '<button onclick="fecharModal()" class="btn btn-gray" style="width: 100%; margin-top: 1rem;">Fechar</button>';
    html += '</div>';
    
    // Mostrar em modal
    mostrarModal(html);
}

// Funções auxiliares de modal (criar se não existir)
function mostrarModal(conteudo) {
    var modal = document.getElementById('modalDetalhamento');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalDetalhamento';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = '<div style="background: white; border-radius: 16px; padding: 2rem; max-width: 90vw; max-height: 90vh; overflow-y: auto;">' + conteudo + '</div>';
    modal.style.display = 'flex';
    
    // Fechar ao clicar fora
    modal.onclick = function(e) {
        if (e.target === modal) {
            fecharModal();
        }
    };
}

function fecharModal() {
    var modal = document.getElementById('modalDetalhamento');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Atualizar dados base da análise
function atualizarDadosBaseAnalise() {
    var precoVenda = parseFloat(document.getElementById('precoVendaAtual').value) || 0;
    var custo = parseFloat(document.getElementById('custoAnalise').value) || 0;
    var empresaId = document.getElementById('empresaAnalise').value;
    var marketplaceId = document.getElementById('marketplaceAnalise').value;
    var freteImposto = parseFloat(document.getElementById('freteAnalise').value) || 0;
    var freteComissao = parseFloat(document.getElementById('freteComissaoAnalise').value) || 0;
    
    // Atualizar todos os cenários
    for (var i = 0; i < cenarios.length; i++) {
        cenarios[i].precoVenda = precoVenda;
        cenarios[i].custo = custo;
        cenarios[i].empresaId = empresaId;
        cenarios[i].marketplaceId = marketplaceId;
        cenarios[i].freteParaImposto = freteImposto;
        cenarios[i].freteParaComissao = freteComissao;
    }
    
    atualizarListaCenarios();
}

// Atualizar selects da tela de análise
function atualizarSelectsAnalise() {
    var selectEmpresa = document.getElementById('empresaAnalise');
    var selectMarketplace = document.getElementById('marketplaceAnalise');
    
    if (!selectEmpresa || !selectMarketplace) return;
    
    selectEmpresa.innerHTML = '<option value="">Selecione...</option>';
    selectMarketplace.innerHTML = '<option value="">Selecione...</option>';
    
    for (var i = 0; i < empresas.length; i++) {
        selectEmpresa.innerHTML += '<option value="' + empresas[i].id + '">' + empresas[i].nome + '</option>';
    }
    
    for (var i = 0; i < marketplaces.length; i++) {
        selectMarketplace.innerHTML += '<option value="' + marketplaces[i].id + '">' + marketplaces[i].nome + '</option>';
    }
}

console.log("✅ Módulo de Análise Reversa carregado com sucesso!");
