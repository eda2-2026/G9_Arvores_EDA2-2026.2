class NoAVL {
    constructor(chave) {
        this.chave = chave;
        this.esquerda = null;
        this.direita = null;
        this.altura = 1;
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
    }
}

class ArvoreAVL {
    constructor(onLog, onRotation) {
        this.raiz = null;
        this.onLog = onLog || console.log;
        this.onRotation = onRotation || (() => {});
    }

    altura(n) { return n ? n.altura : 0; }
    
    fatorBalanceamento(n) {
        return n ? this.altura(n.esquerda) - this.altura(n.direita) : 0;
    }

    atualizarAltura(n) {
        if (n) {
            n.altura = 1 + Math.max(this.altura(n.esquerda), this.altura(n.direita));
        }
    }

    rotacaoDireita(y) {
        let x = y.esquerda;
        let T2 = x.direita;
        x.direita = y;
        y.esquerda = T2;
        this.atualizarAltura(y);
        this.atualizarAltura(x);
        this.onLog(`🔄 Rotação Simples à Direita (LL) em [${y.chave}]`);
        this.onRotation();
        return x;
    }

    rotacaoEsquerda(x) {
        let y = x.direita;
        let T2 = y.esquerda;
        y.esquerda = x;
        x.direita = T2;
        this.atualizarAltura(x);
        this.atualizarAltura(y);
        this.onLog(`🔄 Rotação Simples à Esquerda (RR) em [${x.chave}]`);
        this.onRotation();
        return y;
    }

    inserir(chave) {
        this.raiz = this._inserirRec(this.raiz, chave);
    }

    _inserirRec(no, chave) {
        if (!no) return new NoAVL(chave);
        if (chave < no.chave) no.esquerda = this._inserirRec(no.esquerda, chave);
        else if (chave > no.chave) no.direita = this._inserirRec(no.direita, chave);
        else return no;

        this.atualizarAltura(no);
        let fb = this.fatorBalanceamento(no);

        if (fb > 1 && chave < no.esquerda.chave) return this.rotacaoDireita(no);
        if (fb < -1 && chave > no.direita.chave) return this.rotacaoEsquerda(no);
        if (fb > 1 && chave > no.esquerda.chave) {
            no.esquerda = this.rotacaoEsquerda(no.esquerda);
            this.onLog(`🔄 Rotação Dupla Esquerda-Direita (LR)`);
            this.onRotation();
            return this.rotacaoDireita(no);
        }
        if (fb < -1 && chave < no.esquerda.chave) {
            no.direita = this.rotacaoDireita(no.direita);
            this.onLog(`🔄 Rotação Dupla Direita-Esquerda (RL)`);
            this.onRotation();
            return this.rotacaoEsquerda(no);
        }
        return no;
    }

    remover(chave) {
        this.raiz = this._removerRec(this.raiz, chave);
    }

    _removerRec(no, chave) {
        if (!no) return null;
        if (chave < no.chave) no.esquerda = this._removerRec(no.esquerda, chave);
        else if (chave > no.chave) no.direita = this._removerRec(no.direita, chave);
        else {
            if (!no.esquerda || !no.direita) {
                let temp = no.esquerda ? no.esquerda : no.direita;
                if (!temp) { no = null; } else { no = temp; }
            } else {
                let temp = this._minValorNo(no.direita);
                no.chave = temp.chave;
                no.direita = this._removerRec(no.direita, temp.chave);
            }
        }
        if (!no) return null;

        this.atualizarAltura(no);
        let fb = this.fatorBalanceamento(no);

        if (fb > 1 && this.fatorBalanceamento(no.esquerda) >= 0) return this.rotacaoDireita(no);
        if (fb > 1 && this.fatorBalanceamento(no.esquerda) < 0) {
            no.esquerda = this.rotacaoEsquerda(no.esquerda);
            this.onRotation();
            return this.rotacaoDireita(no);
        }
        if (fb < -1 && this.fatorBalanceamento(no.direita) <= 0) return this.rotacaoEsquerda(no);
        if (fb < -1 && this.fatorBalanceamento(no.direita) > 0) {
            no.direita = this.rotacaoDireita(no.direita);
            this.onRotation();
            return this.rotacaoEsquerda(no);
        }
        return no;
    }

    _minValorNo(no) {
        let atual = no;
        while (atual.esquerda) atual = atual.esquerda;
        return atual;
    }

    obterAlturaMaxima() {
        return this.altura(this.raiz);
    }

    obterTodosNos(no = this.raiz, lista = []) {
        if (!no) return lista;
        this.obterTodosNos(no.esquerda, lista);
        lista.push(no);
        this.obterTodosNos(no.direita, lista);
        return lista;
    }
}