// ==UserScript==
// @name         优化B站图片操作，点击时查看/复制/打开原始图片
// @namespace    https://github.com/SineObama
// @homepage     https://github.com/SineObama/bilibili-player-auto-set-playtype
// @version      0.1.1.20240527
// @description  鼠标点击时暴力加载原图✔，可直接对缩略图进行操作✔，拖拽、右键复制✔，粘贴到TIM等软件✔。 ※实现方式※ 去除地址后缀例如"@!web-comment-note.avif"。 ※吐槽※ 为什么TIM不支持直接粘贴，不支持原本的avif格式？？
// @author       SineObama
// @match        *://*.bilibili.com/*
// @icon         https://www.bilibili.com/favicon.ico
// @grant        none
// @license      MIT
// ==/UserScript==

// 匹配图片后缀并去除，常见格式".jpg@!web-comment-note.avif"
var imgSuffixReg = /(?<=\.[a-z]+)@.*\.[a-z]+$/;

// 右键上下文菜单时触发，以便下一步进行复制之前完成修改
document.addEventListener('contextmenu', removeImgSuffix);

// 拖拽时触发，修改url地址
document.addEventListener('dragstart', replaceDragUrl);

// 利用 mousedown 在拖拽之前修改元素地址，经测试在 Notepad++ 替换不需要这个，而 Obsidian 需要
document.addEventListener('mousedown', removeImgSuffix);
// 拖拽到TIM始终无法正常，用 mousedown 事件也不行，其他情况用拖拽事件即可满足
// 尝试过 event.dataTransfer.items[1].type = 'image/png'; // 也没用

function removeImgSuffix(event) {

    var el = event.target;

    if (el.tagName === 'IMG') {
        var imageUrl = el.src;

        console.debug('点击的图片元素地址:', imageUrl);

        if (imgSuffixReg.test(imageUrl)) {
            var imageUrlNew = imageUrl.replace(imgSuffixReg, '');

            if (replaceImgSrc(el, imageUrl, imageUrlNew)) {
                console.debug('已去除图片地址后缀:', imageUrlNew);
            }
        }
    }
}

function replaceDragUrl(event) {
    // 获取图片或链接（场景下）的地址
    var imageUrl = event.dataTransfer.getData('url');
    if (imageUrl && imgSuffixReg.test(imageUrl)) {
        console.debug('拖拽的图片地址:', imageUrl);
        var imageUrlNew = imageUrl.replace(imgSuffixReg, '');
        event.dataTransfer.setData('url', imageUrlNew);
        console.debug('已去除图片地址后缀:', imageUrlNew);
    }
}

function replaceImgSrc(el, imageUrl, imageUrlNew) {
    // 父级为 picture 元素经测试需要修改其中 source 元素的地址才能使复制的地址生效
    var parentNode = el.parentNode;

    if (parentNode && parentNode.nodeName === 'PICTURE') {
        // 对于多个 source 元素，不确定他会用哪个，所以都暴力改掉
        var flag = false;
        for (var i = 0; i < parentNode.children.length; i++) {
            var child = parentNode.children[i];
            if (child && child.tagName === 'SOURCE' && imageUrl.contains(child.srcset.replace(imgSuffixReg, ''))) {
                child.srcset = imageUrlNew;
                flag = true;
            }
        }
        return flag;
    } else {
        // 一般图片直接替换
        el.src = imageUrlNew;
        return true;
    }
}
