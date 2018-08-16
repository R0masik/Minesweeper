var n = 0;                  // размер поля
var bombCount = 0;          // количество бомб на поле
var newGameKey = 0;         // флаг новой игры
var winKey = 0;             // флаг победы
var gameOverKey = 0;        // флаг окончания игры

var arr = [];               // массив - игровое поле (0 - нет бомбы, 1 - бомба)
var flaggedBombCount = 0;   // количество бомб, помеченных флажками
var openCellsCount = 0;     // количество открытых ячеек

var timer = null;           // таймер
var time = 0;               // время игры

var settH = 0;              // высота окна настроек для корректного отображения гарфических элементов

// начало новой игры
function newGame() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    arr = [];
    flaggedBombCount = 0;
    openCellsCount = 0;
    newGameKey = 1;
    gameOverKey = 0;
    winKey = 0;
    time = 0;
    setSettings();
    drawField();
}

// установка корректных размеров графических элементов
function setFieldSize() {
    // нужная высота тела страницы = высота страницы (целое значение) - верхний и нижний отступы body
    var bodyH = parseInt($('html').height(), 10) - 2 * parseInt($('body').css("margin-top"), 10);
    var topDivH = $('.topDiv').height();
    // смещение для botDiv (также является высотой table) = высота тела - высота topDiv - высота botDiv
    var botDivOffset = bodyH - topDivH - $('.botDiv').height();

    $('.table').css({
        'top': topDivH + 'px',
        'height': botDivOffset + 'px'
    });

    // если открыто окно настроек, смещение для botDiv - высота окна
    if ($('#settings').css('display') === 'table')
        botDivOffset -= settH;

    $('.botDiv').css({
        'margin-top': botDivOffset + 'px'
    });
}

// установка параметров игры из окна настроек
function setSettings() {
    if ($("#beginner").prop("checked")) {
        n = 9;
        bombCount = 10;
    }
    else if ($("#intermediate").prop("checked")) {
        n = 16;
        bombCount = 40;
    }
    else if ($("#expert").prop("checked")) {
        n = 22;
        bombCount = 99;
    }
    else if ($("#custom").prop("checked")) {
        n = parseInt($("#customSize").val(), 10);
        n = Math.max(6, n);
        n = Math.min(22, n);
        $("#customSize").val(n);

        bombCount = parseInt($("#customBombs").val(), 10);
        bombCount = Math.max(1, bombCount);
        bombCount = Math.min(n * n - 1, bombCount);
        $("#customBombs").val(bombCount);
    }
}

// отрисовка игрового поля
function drawField() {
    var tab = $('.table').find('table');
    tab.empty();
    for (var i = 0; i < n; i++) {
        tab.append($('<tr>'));
        var row = tab.find('tr').last();
        for (var j = 0; j < n; j++) {
            row.append('<td class="cell close" id="' + i + 'x' + j + '"></td>');
        }
    }
    $('.bomb').empty().append(bombCount);
    $('.time').empty().append(time);
}

// инициализация массива - поля нулями
function initArray() {
    for (var i = 0; i < n; i++) {
        arr[i] = [];
        for (var j = 0; j < n; j++)
            arr[i][j] = 0;
    }
}

// заполнение массива бомбами
function fillArray(curInd, availBombCountParam) {
    var chance = bombCount / (n * n);
    for (var i = 0; i < n; i++)
        for (var j = 0; j < n; j++) {
            if (Math.random() < chance && availBombCountParam > 0
                // координаты первой открываемой ячейки
                && (i !== curInd[0] || j !== curInd[1])) {
                arr[i][j] = 1;
                availBombCountParam--;
            }
        }
    if (availBombCountParam !== 0) fillArray(curInd, availBombCountParam);
}

// обработка нажатия ЛКМ на ячейку поля
function clickCell(_id) {
    var ind = $.map(_id.split('x'), function (e) {
        return parseInt(e, 10)
    });
    if (newGameKey) {
        var availBombCount = bombCount;
        initArray();
        fillArray(ind, availBombCount);
        timer = setInterval(function () {
            time++;
            $('.time').empty().append(time);
        }, 1000);
        newGameKey = 0;
    }
    var bombsAround = 0;
    if (checkCell(ind)) {
        var imax = setIndMax(ind[0]);
        var imin = setInd(ind[0]);
        var jmax = setIndMax(ind[1]);
        var jmin = setInd(ind[1]);
        for (var i = imin; i <= imax; i++)
            for (var j = jmin; j <= jmax; j++) {
                var cellId = '#' + i + 'x' + j;
                // координаты ячейки, для которой выполняется
                // проверка в радиусе 1 клетки
                if ((i !== ind[0] || j !== ind[1]) &&
                    // проверка выполняется для закрытых или помеченных ячеек
                    ($(cellId).hasClass('close') || $(cellId).hasClass('flag')))
                    if (!checkCell([i, j])) bombsAround++;
            }
        openCell(ind, bombsAround);
        if (!bombsAround) {
            for (var i = imin; i <= imax; i++)
                for (var j = jmin; j <= jmax; j++) {
                    cellId = '#' + i + 'x' + j;
                    if ((i !== ind[0] || j !== ind[1]) && $(cellId).hasClass('close'))
                        clickCell(i + 'x' + j);
                }
        }
    }
    else {
        $('#' + _id).removeClass('close').addClass('bombClicked');
        alert('Вы проиграли!');
        allField();
    }
    if (!gameOverKey)
        checkToWin();
}

// проверка ячейки на отсутствие бомбы
function checkCell(curInd) {
    return !arr[curInd[0]][curInd[1]];
}

// открытие ячейки
function openCell(curInd, bombsAr) {
    var cell = '#' + curInd[0] + 'x' + curInd[1];
    $(cell).removeClass("close").addClass("open" + bombsAr);
    openCellsCount++;
}

// младший индекс соседней ячейки для проверки ее на наличие бомбы
function setInd(num) {
    return (num === 0) ? (0) : (num - 1);
}

// старший индекс соседней ячейки для проверки ее на наличие бомбы
function setIndMax(num) {
    return (num === n - 1) ? (n - 1) : (num + 1);
}

// увеличение счетчика бомб, помеченных флагом
function incFlaggedBombCount() {
    flaggedBombCount++;
    $('.bomb').empty().append(bombCount - flaggedBombCount);
    if (!gameOverKey && !newGameKey)
        checkToWin();
}

// уменьшение счетчика бомб, помеченных флагом
function decFlaggedBombCount() {
    flaggedBombCount--;
    $('.bomb').empty().append(bombCount - flaggedBombCount);
}

// проверка условий для победы
function checkToWin() {
    if (openCellsCount + bombCount === n * n) {
        winKey = 1;
        alert('Вы выиграли!');
        allField();
    }
}

// открытие местоположения бомб после окончания игры
function allField() {
    clearInterval(timer);
    gameOverKey = 1;
    for (var i = 0; i < n; i++)
        for (var j = 0; j < n; j++) {
            var cell = $('#' + i + 'x' + j);
            if (winKey) {
                if (cell.hasClass('close')) {
                    cell.removeClass('close').addClass('flag');
                    incFlaggedBombCount();
                }
            }
            else if (arr[i][j]) {
                if (cell.hasClass('close'))
                    cell.removeClass('close').addClass('bombLeft');
            }
            else {
                if (cell.hasClass('flag'))
                    cell.removeClass('flag').addClass('bombMisFlagged');
            }
        }
}

// открытие ячеек в радиусе 1 клетки при клике на ячейку с цифрой
function openSurroundCells(_id) {
    var ind = $.map(_id.split('x'), function (e) {
        return parseInt(e, 10)
    });
    var imax = setIndMax(ind[0]);
    var imin = setInd(ind[0]);
    var jmax = setIndMax(ind[1]);
    var jmin = setInd(ind[1]);
    var flagsAround = 0;
    for (var i = imin; i <= imax; i++)
        for (var j = jmin; j <= jmax; j++) {
            var cellId = '#' + i + 'x' + j;
            // координаты ячейки, для которой выполняется
            // проверка в радиусе 1 клетки
            if ((i !== ind[0] || j !== ind[1]) && $(cellId).hasClass('flag'))
                flagsAround++;
        }
    var cellClass = $('#' + _id).attr("class");
    if (flagsAround.toString() === cellClass[cellClass.length - 1])
        for (var i = imin; i <= imax; i++)
            for (var j = jmin; j <= jmax; j++) {
                cellId = '#' + i + 'x' + j;
                if ((i !== ind[0] || j !== ind[1]) && $(cellId).hasClass('close'))
                    clickCell(i + 'x' + j);
            }
}

// функции, реализующиеся при загрузке страницы
$(document).ready(function () {

    // определение settH
    $('#settings').toggle();
    settH = document.getElementById('settings').offsetHeight;
    $('#settings').toggle();

    setFieldSize();

    newGame();

    // реализация перемещения окна настроек по экрану
    $('.dialog').draggable();

    // валидатор для ввода корректных значений в поля настроек
    $('.dialog-text-input').on('keypress', function (e) {
        return e.charCode >= 48 && e.charCode <= 57;
    });

    // обработчик щелчка мыши на ячейку поля
    $('.table').on('mousedown', '.cell', function (e) {
        if (!gameOverKey)
            if ($(this).hasClass("close") || $(this).hasClass("flag") || $(this).attr("class").indexOf('open') + 1)
                if (e.which === 1 && !$(this).hasClass("flag")) {
                    if ($(this).hasClass("close"))
                        clickCell(this.id);
                    else
                        openSurroundCells(this.id);
                }
                else if (e.which === 3) {
                    if ($(this).hasClass('close')) {
                        $(this).removeClass('close').addClass('flag');
                        incFlaggedBombCount();
                    }
                    else {
                        $(this).removeClass('flag').addClass('close');
                        decFlaggedBombCount();
                    }
                }
    });

    // открытие/закрытие окна настроек
    $('#settBtn, #settings-close').on('click', function () {
        $('#settings').toggle();
        setFieldSize();
    });

    // обработчик нажатия на кнопку новой игры
    $('#newGameBtn').on('click', function () {
        $('#settBtn').click();
        newGame();
    });

    $(window).resize(function () {
        setFieldSize();
    });
});
