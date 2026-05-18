// ==UserScript==
// @name         夸克网盘下载助手
// @namespace    H1d3rOne
// @version      1.2.0
// @description  夸克网盘增强下载助手。支持批量下载、直链导出、aria2/IDM/cURL、下载历史、文件过滤、深色模式、快捷键操作。
// @author       夸克科技
// @license      MIT
// @icon         https://pan.quark.cn/favicon.ico
// @match        *://pan.quark.cn/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        unsafeWindow
// @run-at       document-end
// @connect      drive.quark.cn
// @connect      127.0.0.1
// @connect      localhost
// @homepage     https://github.com/H1d3rOne/QuarkDownloader
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 配置 ====================
    const CONFIG = {
        // 个人网盘下载 API
        API: "https://drive.quark.cn/1/clouddrive/file/download?pr=ucpro&fr=pc",
        // 分享页面下载 API (POST)
        SHARE_DOWNLOAD_API: "https://drive.quark.cn/1/clouddrive/share/sharepage/download?pr=ucpro&fr=pc",
        SHARE_TOKEN_API: "https://drive.quark.cn/1/clouddrive/share/sharepage/token?pr=ucpro&fr=pc",
        SHARE_DETAIL_API: "https://drive.quark.cn/1/clouddrive/share/sharepage/detail?pr=ucpro&fr=pc",
        SHARE_SAVE_API: "https://drive.quark.cn/1/clouddrive/share/sharepage/save?pr=ucpro&fr=pc",
        TASK_API: "https://drive.quark.cn/1/clouddrive/task?pr=ucpro&fr=pc",
        FILE_CREATE_API: "https://drive.quark.cn/1/clouddrive/file?pr=ucpro&fr=pc",
        FILE_DELETE_API: "https://drive.quark.cn/1/clouddrive/file/delete?pr=ucpro&fr=pc",
        // 文件夹内容列表 API
        FOLDER_LIST_API: "https://drive.quark.cn/1/clouddrive/file/sort?pr=ucpro&fr=pc&uc_param_str=&pdir_fid=",
        UA: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) quark-cloud-drive/2.5.20 Chrome/100.0.4896.160 Electron/18.3.5.4-b478491100 Safari/537.36 Channel/pckk_other_ch",
        DEPTH: 25,
        VERSION: "1.2.0",
        DEBUG: false, // 调试模式
        HISTORY_MAX: 100,
        FOLDER_MAX_DEPTH: 5, // 文件夹递归最大深度
        FOLDER_MAX_FILES: 500, // 文件夹最大文件数
        SHORTCUTS: {
            DOWNLOAD: 'ctrl+d',
            CLOSE: 'Escape'
        },
        SHARE_SAVE_ROOT_NAME: '来自：分享',
        SHARE_SESSION_PREFIX: '下载-',
        MOTRIX_RPC_URL: "http://127.0.0.1:16800/jsonrpc",
        MOTRIX_RPC_TOKEN: GM_getValue('quark_motrix_rpc_token', ''),
    };

    const ICONS = {
        zap: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
        folder: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h16z"/></svg>',
        folderOpen: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg>',
        clock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        settings: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
        checkCircle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        play: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
        music: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
        image: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',
        fileText: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',
        archive: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>',
        file: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>',
        download: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>',
        rocket: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
        terminal: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>',
        loader: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="6"/><line x1="12" x2="12" y1="18" y2="22"/><line x1="4.93" x2="7.76" y1="4.93" y2="7.76"/><line x1="16.24" x2="19.07" y1="16.24" y2="19.07"/><line x1="2" x2="6" y1="12" y2="12"/><line x1="18" x2="22" y1="12" y2="12"/><line x1="4.93" x2="7.76" y1="19.07" y2="16.24"/><line x1="16.24" x2="19.07" y1="7.76" y2="4.93"/></svg>',
        trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>',
        moon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
        globe: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
        keyboard: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="4" rx="2"/><path d="M6 8h.001"/><path d="M10 8h.001"/><path d="M14 8h.001"/><path d="M18 8h.001"/><path d="M8 12h.001"/><path d="M12 12h.001"/><path d="M16 12h.001"/><path d="M7 16h10"/></svg>',
        sparkles: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>',
        inbox: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
        wrench: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
        sun: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
        tag: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>',
        timer: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/></svg>',
        lightbulb: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
        calendar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>',
        x: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
        chevronDown: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
        chevronRight: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
        hardDrive: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/><line x1="10" x2="10.01" y1="16" y2="16"/>',
        package: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>'
    };

    const ICON = (name, cls = '') => `<span class="quark-svg-icon ${cls}">${ICONS[name] || ICONS.file}</span>`;

    // ==================== 国际化 ====================
    const i18n = {
        zh: {
            title: '夸克网盘下载助手',
            downloadHelper: '下载助手',
            processing: '处理中...',
            success: '解析成功',
            error: '错误',
            noFiles: '请先勾选需要下载的文件',
            networkError: '网络请求失败，请检查网络',
            parseError: '解析失败',
            copied: '已复制到剪贴板',
            copyAll: '复制全部链接',
            copyAria2: '导出 aria2',
            copyCurl: '导出 cURL',
            sendToIdm: 'IDM 下载',
            sendToAria2: 'aria2 下载',
            sendToCurl: 'cURL 下载',
            sendToMotrix: '发送到 Motrix',
            motrixLaunched: 'Motrix 已唤起',
            motrixBatchSent: 'Motrix 批量任务已发送',
            shareKeepDownload: '保存下载',
            shareCleanDownload: '无痕下载',
            shareMode: '下载模式',
            shareTargetFolder: '保存位置',
            sharePasscodePrompt: '请输入分享提取码',
            shareSelectTip: '请勾选需要下载的分享文件或文件夹',
            sharePreparing: '正在准备分享下载...',
            shareCleanupFailed: '下载已发出，但清理失败',
            shareNoFiles: '未获取到分享文件',
            shareSaved: '分享文件已保存',
            shareBatchComplete: '分享下载完成',
            shareBatchSucceeded: '成功',
            shareBatchFailed: '失败',
            shareBatchItems: '项',
            download: '下载',
            fileName: '文件名',
            fileSize: '大小',
            action: '操作',
            history: '历史记录',
            clearHistory: '清空历史',
            settings: '设置',
            darkMode: '深色模式',
            language: '语言',
            filterByType: '按类型筛选',
            filterBySize: '按大小筛选',
            all: '全部',
            video: '视频',
            audio: '音频',
            image: '图片',
            document: '文档',
            archive: '压缩包',
            other: '其他',
            noHistory: '暂无下载历史',
            close: '关闭',
            files: '个文件',
            idmTip: 'IDM 下载需在 IDM 中设置以下 UA',
            copyUa: '复制',
            uaCopied: 'UA 已复制',
            quickDownload: '快速下载',
            batchExport: '批量导出',
            totalSize: '总大小',
            selectAll: '全选',
            deselectAll: '取消全选',
            confirm: '确定',
            cancel: '取消',
            auto: '跟随系统',
            light: '浅色',
            dark: '深色',
            totalDownloads: '总下载',
            fileTypes: '文件类型',
            timeline: '时间线',
            galaxy: '星系',
            clickToExplore: '点击星球查看详情',
            downloadTime: '下载时间',
            starSize: '星球大小由文件大小决定',
            folder: '文件夹',
            scanningFolder: '正在扫描文件夹...',
            folderContains: '文件夹包含',
            filesInFolder: '个文件',
            foldersSelected: '个文件夹',
            expandingFolders: '正在展开文件夹',
            folderTooDeep: '文件夹层级过深，已跳过部分内容',
            folderTooMany: '文件数量过多，已达到上限',
            includeFolders: '包含文件夹',
            motrixSettings: 'Motrix 设置',
            motrixRpcUrl: 'RPC 地址',
            motrixRpcToken: 'RPC 密钥',
            motrixRpcTokenTip: '留空表示无密钥'
        },
        en: {
            title: 'Quark Downloader',
            downloadHelper: 'Download Helper',
            processing: 'Processing...',
            success: 'Parse Success',
            error: 'Error',
            noFiles: 'Please select files to download',
            networkError: 'Network error, please check connection',
            parseError: 'Parse failed',
            copied: 'Copied to clipboard',
            copyAll: 'Copy All Links',
            copyAria2: 'Export aria2',
            copyCurl: 'Export cURL',
            sendToIdm: 'IDM Download',
            sendToAria2: 'aria2 Download',
            sendToCurl: 'cURL Download',
            sendToMotrix: 'Send to Motrix',
            motrixLaunched: 'Motrix launched',
            motrixBatchSent: 'Motrix batch tasks sent',
            shareKeepDownload: 'Keep Download',
            shareCleanDownload: 'Clean Download',
            shareMode: 'Download Mode',
            shareTargetFolder: 'Save To',
            sharePasscodePrompt: 'Enter share passcode',
            shareSelectTip: 'Please select shared files or folders to download',
            sharePreparing: 'Preparing shared download...',
            shareCleanupFailed: 'Download started, but cleanup failed',
            shareNoFiles: 'No shared files found',
            shareSaved: 'Shared files saved',
            shareBatchComplete: 'Shared download complete',
            shareBatchSucceeded: 'Succeeded',
            shareBatchFailed: 'Failed',
            shareBatchItems: 'item(s)',
            download: 'Download',
            fileName: 'Filename',
            fileSize: 'Size',
            action: 'Action',
            history: 'History',
            clearHistory: 'Clear History',
            settings: 'Settings',
            darkMode: 'Dark Mode',
            language: 'Language',
            filterByType: 'Filter by Type',
            filterBySize: 'Filter by Size',
            all: 'All',
            video: 'Video',
            audio: 'Audio',
            image: 'Image',
            document: 'Document',
            archive: 'Archive',
            other: 'Other',
            noHistory: 'No download history',
            close: 'Close',
            files: 'files',
            idmTip: 'IDM requires the following UA to download',
            copyUa: 'Copy',
            uaCopied: 'UA Copied',
            quickDownload: 'Quick Download',
            batchExport: 'Batch Export',
            totalSize: 'Total Size',
            selectAll: 'Select All',
            deselectAll: 'Deselect All',
            confirm: 'Confirm',
            cancel: 'Cancel',
            auto: 'Auto',
            light: 'Light',
            dark: 'Dark',
            totalDownloads: 'Total Downloads',
            fileTypes: 'File Types',
            timeline: 'Timeline',
            galaxy: 'Galaxy',
            clickToExplore: 'Click a planet to see details',
            downloadTime: 'Download Time',
            starSize: 'Planet size represents file size',
            folder: 'Folder',
            scanningFolder: 'Scanning folder...',
            folderContains: 'Folder contains',
            filesInFolder: 'files',
            foldersSelected: 'folders',
            expandingFolders: 'Expanding folders',
            folderTooDeep: 'Folder too deep, some content skipped',
            folderTooMany: 'Too many files, limit reached',
            includeFolders: 'Include Folders',
            motrixSettings: 'Motrix Settings',
            motrixRpcUrl: 'RPC URL',
            motrixRpcToken: 'RPC Token',
            motrixRpcTokenTip: 'Leave empty for no token'
        }
    };

    // ==================== 状态管理 ====================
    const State = {
        lang: GM_getValue('quark_lang', 'zh'),
        theme: GM_getValue('quark_theme', 'auto'),
        history: GM_getValue('quark_history', []),
        shareDownloadMode: GM_getValue('quark_share_download_mode', 'keep'),
        shareDownloadConcurrency: GM_getValue('quark_share_download_concurrency', 3),
        motrixRpcUrl: GM_getValue('quark_motrix_rpc_url', 'http://127.0.0.1:16800/jsonrpc'),
        motrixRpcToken: GM_getValue('quark_motrix_rpc_token', ''),
        shareSelectedIds: [],
        shareTreeData: [],
        shareLoadedFolderIds: new Set(),
        shareToken: '',
        sharePwdId: '',
        shareTargetFolderId: '',
        shareTargetFolderOptions: [],
        shareTransferredItems: [],

        getLang() {
            return i18n[this.lang] || i18n.zh;
        },

        setLang(lang) {
            this.lang = lang;
            GM_setValue('quark_lang', lang);
        },

        setTheme(theme) {
            this.theme = theme;
            GM_setValue('quark_theme', theme);
            UI.applyTheme();
        },

        setShareDownloadMode(mode) {
            this.shareDownloadMode = mode;
            GM_setValue('quark_share_download_mode', mode);
        },

        setShareDownloadConcurrency(count) {
            const nextCount = Number(count);
            this.shareDownloadConcurrency = Number.isFinite(nextCount) && nextCount > 0 ? Math.floor(nextCount) : 3;
            GM_setValue('quark_share_download_concurrency', this.shareDownloadConcurrency);
        },

        setMotrixRpcUrl(url) {
            const nextUrl = String(url || '').trim() || 'http://127.0.0.1:16800/jsonrpc';
            this.motrixRpcUrl = nextUrl;
            GM_setValue('quark_motrix_rpc_url', nextUrl);
        },

        setMotrixRpcToken(token) {
            this.motrixRpcToken = String(token || '').trim();
            GM_setValue('quark_motrix_rpc_token', this.motrixRpcToken);
        },

        resetShareContext() {
            this.shareSelectedIds = [];
            this.shareTreeData = [];
            this.shareLoadedFolderIds = new Set();
            this.shareToken = '';
            this.sharePwdId = '';
            this.shareTargetFolderId = '';
            this.shareTargetFolderOptions = [];
            this.shareTransferredItems = [];
        },

        isDark() {
            if (this.theme === 'auto') {
                return window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
            return this.theme === 'dark';
        },

        addHistory(files) {
            const newHistory = files.map(f => ({
                name: f.file_name,
                size: f.size,
                time: Date.now()
            }));
            this.history = [...newHistory, ...this.history].slice(0, CONFIG.HISTORY_MAX);
            GM_setValue('quark_history', this.history);
        },

        clearHistory() {
            this.history = [];
            GM_setValue('quark_history', []);
        }
    };

    // ==================== 工具函数 ====================
    const Utils = {
        escapeHtml: (value = '') => String(value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;'),
        log: (...args) => {
            if (CONFIG.DEBUG) {
                console.log('[夸克网盘下载助手]', ...args);
            }
        },

        // 检测是否在分享页面
        isSharePage: () => {
            return location.pathname.includes('/s/') || location.search.includes('pwd_id');
        },

        // 获取分享页面参数
        getShareParams: () => {
            // 从 URL 获取 pwd_id
            let pwdId = null;
            let passcode = '';
            const pathMatch = location.pathname.match(/\/s\/([a-zA-Z0-9]+)/);
            if (pathMatch) {
                pwdId = pathMatch[1];
            } else {
                const urlParams = new URLSearchParams(location.search);
                pwdId = urlParams.get('pwd_id');
            }

            const urlParams = new URLSearchParams(location.search);
            passcode = urlParams.get('passcode') || urlParams.get('pwd') || '';

            // 从 cookie 或页面获取 stoken
            let stoken = '';
            const stokenMatch = document.cookie.match(/__puus=([^;]+)/);
            if (stokenMatch) {
                stoken = decodeURIComponent(stokenMatch[1]);
            }

            // 尝试从页面 window 对象获取
            if (!stoken && unsafeWindow?.__INITIAL_STATE__?.shareToken) {
                stoken = unsafeWindow.__INITIAL_STATE__.shareToken;
            }

            if (!stoken) {
                stoken = Utils.getShareTokenFromPageState();
            }

            // 从页面 script 标签中查找
            if (!stoken) {
                const scripts = document.querySelectorAll('script');
                for (const script of scripts) {
                    const match = script.textContent?.match(/stoken["']?\s*[:=]\s*["']([^"']+)["']/);
                    if (match) {
                        stoken = match[1];
                        break;
                    }
                }
            }

            if (!passcode) {
                const passcodeInput = document.querySelector('input[placeholder*="提取码"], input[placeholder*="密码"], input[maxlength="4"]');
                if (passcodeInput?.value) {
                    passcode = passcodeInput.value.trim();
                }
            }

            if (!passcode) {
                const pageText = document.body?.innerText || '';
                const match = pageText.match(/(?:提取码|密码)[：:]\s*([a-zA-Z0-9]+)/i);
                if (match) {
                    passcode = match[1];
                }
            }

            console.log('[夸克网盘下载助手] 分享参数:', { pwdId, stoken: stoken ? '已获取' : '未获取', passcode: passcode ? '已获取' : '未获取' });
            return { pwdId, stoken, passcode };
        },

        getShareTokenFromPageState: () => {
            const win = unsafeWindow || window;
            const visited = new WeakSet();
            let token = '';
            const possibleVars = ['__INITIAL_STATE__', '__DATA__', '__APP_DATA__', 'pageData', 'appData'];

            const scan = (node, depth = 0) => {
                if (token || !node || depth > 6) return;
                if (typeof node !== 'object' && typeof node !== 'function') return;
                if (visited.has(node)) return;
                visited.add(node);

                const candidates = [
                    node.shareToken,
                    node.stoken,
                    node.share_token,
                    node.share?.shareToken,
                    node.share?.stoken,
                    node.data?.shareToken,
                    node.data?.stoken,
                    node.props?.shareToken,
                    node.props?.stoken,
                    node.memoizedProps?.shareToken,
                    node.memoizedProps?.stoken,
                    node.memoizedState?.shareToken,
                    node.memoizedState?.stoken
                ].filter(value => typeof value === 'string' && value.trim());

                if (candidates.length > 0) {
                    token = candidates[0].trim();
                    return;
                }

                const nextKeys = ['share', 'data', 'props', 'state', 'memoizedState', 'memoizedProps', 'pendingProps', 'shareInfo', 'detail'];
                for (const key of nextKeys) {
                    if (token) return;
                    if (node[key]) scan(node[key], depth + 1);
                }

                if (token) return;
                const entries = Object.entries(node).slice(0, 25);
                for (const [, value] of entries) {
                    if (token) return;
                    if (value && (Array.isArray(value) || typeof value === 'object')) {
                        scan(value, depth + 1);
                    }
                }
            };

            for (const varName of possibleVars) {
                if (token) break;
                if (win[varName]) scan(win[varName]);
            }

            const storeState = win.__REDUX_STORE__?.getState?.() || win.store?.getState?.() || win.__store__?.getState?.() || null;
            if (!token && storeState) {
                scan(storeState);
            }

            return token;
        },

        normalizeShareItem: (candidate, context = {}) => {
            if (!candidate || typeof candidate !== 'object') return null;
            const fid = candidate.fid || candidate.id || candidate.file_id || candidate.node_id;
            const fileName = candidate.file_name || candidate.name || candidate.fileName || candidate.title;
            if (!fid || !fileName) return null;

            const isDir =
                candidate.file_type === 0 ||
                candidate.dir === true ||
                candidate.is_dir === true ||
                candidate.obj_category === 'folder' ||
                candidate.type === 'folder' ||
                candidate.category === 0;

            const pdirFid = candidate.pdir_fid || candidate.parent_fid || candidate.dir_id || context.pdirFid || '0';
            const folderPath = context.folderPath || candidate.folderPath || '';
            const fullPath = candidate.fullPath || (folderPath ? `${folderPath}/${fileName}` : fileName);

            return {
                fid,
                file_name: fileName,
                name: fileName,
                file_type: isDir ? 0 : (candidate.file_type ?? 1),
                isDir,
                size: candidate.size || candidate.file_size || candidate.dir_size || 0,
                pdir_fid: pdirFid,
                share_fid_token: candidate.share_fid_token || candidate.fid_token || '',
                folderPath,
                fullPath,
                download_url: candidate.download_url || ''
            };
        },

        upsertShareItem: (bucket, item, state) => {
            if (!item?.fid) return;
            const existingIndex = state.indexByFid.get(item.fid);
            if (existingIndex === undefined) {
                state.indexByFid.set(item.fid, bucket.length);
                bucket.push(item);
                return;
            }

            const existing = bucket[existingIndex];
            bucket[existingIndex] = {
                ...existing,
                ...item,
                file_name: item.file_name || existing.file_name,
                name: item.name || existing.name,
                file_type: item.file_type ?? existing.file_type,
                isDir: item.isDir ?? existing.isDir,
                size: item.size || existing.size || 0,
                pdir_fid: item.pdir_fid || existing.pdir_fid || '0',
                share_fid_token: item.share_fid_token || existing.share_fid_token || '',
                folderPath: item.folderPath || existing.folderPath || '',
                fullPath: item.fullPath || existing.fullPath || item.file_name || existing.file_name,
                download_url: item.download_url || existing.download_url || ''
            };
        },

        collectShareItemsFromPageNode: (node, context = {}, bucket = [], state = null) => {
            const runtimeState = state || { visited: new WeakSet(), indexByFid: new Map() };
            if (!node) return bucket;

            if (Array.isArray(node)) {
                for (const item of node) {
                    if (bucket.length >= CONFIG.FOLDER_MAX_FILES) break;
                    Utils.collectShareItemsFromPageNode(item, context, bucket, runtimeState);
                }
                return bucket;
            }

            if (typeof node !== 'object' && typeof node !== 'function') {
                return bucket;
            }

            if (runtimeState.visited.has(node)) {
                return bucket;
            }
            runtimeState.visited.add(node);

            const normalized = Utils.normalizeShareItem(node, context);
            if (normalized) {
                Utils.upsertShareItem(bucket, normalized, runtimeState);

                if (normalized.isDir) {
                    const nextContext = { pdirFid: normalized.fid, folderPath: normalized.fullPath };
                    const childKeys = ['children', 'list', 'items', 'fileList', 'dataSource', 'nodes', 'records', 'files'];
                    for (const key of childKeys) {
                        if (bucket.length >= CONFIG.FOLDER_MAX_FILES) break;
                        if (node[key]) {
                            Utils.collectShareItemsFromPageNode(node[key], nextContext, bucket, runtimeState);
                        }
                    }
                }
                return bucket;
            }

            const nestedKeys = ['list', 'items', 'children', 'fileList', 'dataSource', 'records', 'nodes', 'files', 'data', 'props', 'state', 'memoizedState', 'memoizedProps', 'pendingProps', 'share', 'shareInfo', 'detail'];
            for (const key of nestedKeys) {
                if (bucket.length >= CONFIG.FOLDER_MAX_FILES) break;
                if (node[key]) {
                    Utils.collectShareItemsFromPageNode(node[key], context, bucket, runtimeState);
                }
            }

            return bucket;
        },

        getShareFilesFromPage: () => {
            const win = unsafeWindow || window;
            const shareItems = [];
            const state = { visited: new WeakSet(), indexByFid: new Map() };
            const possibleVars = ['__INITIAL_STATE__', '__DATA__', '__APP_DATA__', 'pageData', 'appData'];

            for (const varName of possibleVars) {
                if (!win[varName]) continue;
                Utils.collectShareItemsFromPageNode(win[varName], {}, shareItems, state);
            }

            const storeState = win.__REDUX_STORE__?.getState?.() || win.store?.getState?.() || win.__store__?.getState?.() || null;
            if (storeState) {
                Utils.collectShareItemsFromPageNode(storeState, {}, shareItems, state);
            }

            const containers = document.querySelectorAll('#root, #app, .ant-table-wrapper, .ant-table-body, .file-list, [class*="fileList"], [class*="list-view"], [class*="content-list"]');
            containers.forEach(container => {
                const reactKeys = Object.keys(container).filter(key =>
                    key.startsWith('__reactFiber$') ||
                    key.startsWith('__reactProps$') ||
                    key.startsWith('__reactContainer$')
                );

                reactKeys.forEach(key => {
                    const fiber = container[key];
                    if (!fiber) return;
                    Utils.collectShareItemsFromPageNode(fiber.memoizedProps, {}, shareItems, state);
                    Utils.collectShareItemsFromPageNode(fiber.pendingProps, {}, shareItems, state);
                    Utils.collectShareItemsFromPageNode(fiber.memoizedState, {}, shareItems, state);
                    Utils.collectShareItemsFromPageNode(fiber.stateNode?.props, {}, shareItems, state);
                });
            });

            document.querySelectorAll('.ant-table-row, [class*="file-item"], [class*="fileItem"], [class*="list-item"], [data-row-key]').forEach(row => {
                if (shareItems.length >= CONFIG.FOLDER_MAX_FILES) return;
                const fileData = Utils.getFileFromRow(row);
                const normalized = Utils.normalizeShareItem(fileData, {});
                if (normalized) {
                    Utils.upsertShareItem(shareItems, normalized, state);
                }
            });

            return {
                items: shareItems,
                token: Utils.getShareTokenFromPageState()
            };
        },

        // 从 React Fiber 中提取文件信息
        getFidFromFiber: (dom) => {
            if (!dom) return null;

            // 尝试从当前元素及其父元素查找
            let currentDom = dom;
            for (let domAttempt = 0; domAttempt < 10 && currentDom; domAttempt++) {
                const key = Object.keys(currentDom).find(k =>
                    k.startsWith('__reactFiber$') ||
                    k.startsWith('__reactInternalInstance$') ||
                    k.startsWith('__reactProps$')
                );

                if (key) {
                    let fiber = currentDom[key];
                    let attempts = 0;

                    while (fiber && attempts < CONFIG.DEPTH) {
                        const props = fiber.memoizedProps || fiber.pendingProps || fiber;

                        // 尝试多种可能的属性名
                        const candidates = [
                            props?.record,
                            props?.file,
                            props?.item,
                            props?.data,
                            props?.node,
                            props?.fileInfo,
                            props?.fileData,
                            props?.children?.props?.record,
                            props?.children?.props?.file,
                            fiber?.memoizedState?.memoizedState,
                            fiber?.stateNode?.props?.record,
                            fiber?.stateNode?.props?.file
                        ].filter(Boolean);

                        for (const candidate of candidates) {
                            if (candidate && (candidate.fid || candidate.id || candidate.file_id)) {
                                // 判断是否为文件夹 - 更保守的判断
                                const isDirectory =
                                    candidate.dir === true ||
                                    candidate.is_dir === true ||
                                    candidate.type === 'folder' ||
                                    candidate.obj_category === 'folder' ||
                                    (candidate.category !== undefined && candidate.category === 0);

                                const fileData = {
                                    fid: candidate.fid || candidate.id || candidate.file_id,
                                    name: candidate.file_name || candidate.name || candidate.title || candidate.fileName || "未命名文件",
                                    file_name: candidate.file_name || candidate.name || candidate.title || candidate.fileName || "未命名文件",
                                    isDir: isDirectory,
                                    file_type: isDirectory ? 0 : (candidate.file_type ?? 1),
                                    size: candidate.size || candidate.file_size || 0,
                                    pdir_fid: candidate.pdir_fid || candidate.parent_fid || candidate.dir_id || '0',
                                    share_fid_token: candidate.share_fid_token || candidate.fid_token || '',
                                    download_url: candidate.download_url
                                };
                                Utils.log('找到文件:', fileData.name, 'isDir:', fileData.isDir, '原始数据:', candidate);
                                return fileData;
                            }
                        }

                        fiber = fiber.return;
                        attempts++;
                    }
                }
                currentDom = currentDom.parentElement;
            }
            return null;
        },

        // 从行元素中提取文件信息
        getFileFromRow: (row) => {
            if (!row) return null;

            // 方法1: 从 React Fiber 获取
            const fiberData = Utils.getFidFromFiber(row);
            if (fiberData) return fiberData;

            // 方法2: 从 data 属性获取
            const dataFid = row.getAttribute('data-fid') || row.getAttribute('data-id') || row.getAttribute('data-file-id');
            if (dataFid) {
                const fileName = row.querySelector('.file-name, .name, [class*="fileName"], [class*="file_name"]')?.textContent?.trim();
                return {
                    fid: dataFid,
                    name: fileName || '未命名文件',
                    isDir: row.classList.contains('folder') || row.getAttribute('data-type') === 'folder',
                    size: 0
                };
            }

            // 方法3: 遍历子元素查找
            const allElements = row.querySelectorAll('*');
            for (const el of allElements) {
                const data = Utils.getFidFromFiber(el);
                if (data) return data;
            }

            return null;
        },

        post: (url, data) => {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "POST",
                    url: url,
                    headers: {
                        "Content-Type": "application/json",
                        "User-Agent": CONFIG.UA,
                        "Cookie": document.cookie
                    },
                    data: JSON.stringify(data),
                    responseType: 'json',
                    withCredentials: true,
                    onload: res => {
                        if (res.status === 200) {
                            resolve(res.response);
                        } else {
                            reject(res);
                        }
                    },
                    onerror: err => reject(err)
                });
            });
        },

        // GET 请求
        get: (url) => {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: url,
                    headers: {
                        "User-Agent": CONFIG.UA,
                        "Cookie": document.cookie
                    },
                    responseType: 'json',
                    withCredentials: true,
                    onload: res => {
                        if (res.status === 200) {
                            resolve(res.response);
                        } else {
                            reject(res);
                        }
                    },
                    onerror: err => reject(err)
                });
            });
        },

        fetchJsonInPageContext: (url, options = {}) => new Promise((resolve, reject) => {
            if (!url) {
                reject(new Error('请求地址为空'));
                return;
            }

            const requestId = `quark-page-fetch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const eventType = `QUARK_PAGE_FETCH_RESULT_${requestId}`;
            const timeout = typeof options.timeout === 'number' ? options.timeout : 60000;
            let timer = null;

            const finishWithPayload = (payload = {}) => {
                cleanup();

                if (payload.ok) {
                    resolve(payload.data);
                    return;
                }

                const error = new Error(payload.error || payload.data?.message || `请求失败 (${payload.status || 0})`);
                error.status = payload.status || 0;
                error.response = payload.data;
                error.responseText = payload.responseText || '';
                error.finalUrl = url;
                reject(error);
            };

            const cleanup = () => {
                window.removeEventListener('message', onMessage);
                document.removeEventListener(eventType, onCustomEvent);
                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }
            };

            const onMessage = (event) => {
                const payload = event.data || {};
                if (payload.type !== 'QUARK_PAGE_FETCH_RESULT' || payload.id !== requestId) return;
                finishWithPayload(payload);
            };

            const onCustomEvent = (event) => {
                const payload = event.detail || {};
                if (payload.type !== 'QUARK_PAGE_FETCH_RESULT' || payload.id !== requestId) return;
                finishWithPayload(payload);
            };

            window.addEventListener('message', onMessage);
            document.addEventListener(eventType, onCustomEvent);
            timer = window.setTimeout(() => {
                cleanup();
                const error = new Error('页面请求超时');
                error.status = 0;
                error.finalUrl = url;
                reject(error);
            }, timeout);

            const requestOptions = {
                method: options.method || 'GET',
                headers: options.headers || {},
                body: typeof options.body === 'undefined' ? null : options.body
            };

            const script = document.createElement('script');
            script.textContent = `
                (() => {
                    const requestId = ${JSON.stringify(requestId)};
                    const eventType = ${JSON.stringify(eventType)};
                    const url = ${JSON.stringify(url)};
                    const options = ${JSON.stringify(requestOptions)};
                    const done = (payload) => {
                        const detail = {
                            type: 'QUARK_PAGE_FETCH_RESULT',
                            id: requestId,
                            ...payload
                        };
                        document.dispatchEvent(new CustomEvent(eventType, { detail }));
                        window.postMessage(detail, '*');
                    };

                    fetch(url, {
                        method: options.method || 'GET',
                        headers: options.headers || {},
                        body: options.body == null ? undefined : options.body,
                        credentials: 'include'
                    }).then(async (response) => {
                        const responseText = await response.text();
                        let data = null;
                        try {
                            data = responseText ? JSON.parse(responseText) : null;
                        } catch (error) {
                            data = responseText;
                        }

                        done({
                            ok: response.ok,
                            status: response.status,
                            data,
                            responseText
                        });
                    }).catch((error) => {
                        done({
                            ok: false,
                            status: 0,
                            error: error?.message || String(error),
                            responseText: ''
                        });
                    });
                })();
            `;
            (document.head || document.documentElement).appendChild(script);
            script.remove();
        }),

        // 获取文件夹内容列表
        getFolderContents: async (fid, page = 1, pageSize = 100) => {
            const url = `${CONFIG.FOLDER_LIST_API}${fid}&_page=${page}&_size=${pageSize}&_sort=file_type:asc,updated_at:desc`;
            try {
                const res = await Utils.get(url);
                if (res && res.code === 0 && res.data && res.data.list) {
                    return {
                        list: res.data.list,
                        total: res.metadata?._total || res.data.list.length,
                        hasMore: res.data.list.length >= pageSize
                    };
                }
                return { list: [], total: 0, hasMore: false };
            } catch (e) {
                Utils.log('获取文件夹内容失败:', e);
                return { list: [], total: 0, hasMore: false };
            }
        },

        // 递归获取文件夹内所有文件
        getAllFilesInFolder: async (fid, folderName = '', depth = 0, onProgress = null) => {
            const allFiles = [];
            const L = State.getLang();

            if (depth >= CONFIG.FOLDER_MAX_DEPTH) {
                Utils.log('达到最大递归深度:', depth);
                return { files: allFiles, warning: 'depth' };
            }

            let page = 1;
            let hasMore = true;
            let warning = null;

            while (hasMore && allFiles.length < CONFIG.FOLDER_MAX_FILES) {
                const result = await Utils.getFolderContents(fid, page, 100);

                for (const item of result.list) {
                    if (allFiles.length >= CONFIG.FOLDER_MAX_FILES) {
                        warning = 'count';
                        break;
                    }

                    const isDir = item.dir === true || item.is_dir === true ||
                                  item.file_type === 0 || item.obj_category === 'folder';

                    if (isDir) {
                        // 递归获取子文件夹
                        const subPath = folderName ? `${folderName}/${item.file_name}` : item.file_name;
                        if (onProgress) {
                            onProgress(`${L.scanningFolder} ${subPath}`);
                        }
                        const subResult = await Utils.getAllFilesInFolder(
                            item.fid,
                            subPath,
                            depth + 1,
                            onProgress
                        );
                        allFiles.push(...subResult.files);
                        if (subResult.warning) warning = subResult.warning;
                    } else {
                        // 添加文件，保留文件夹路径
                        allFiles.push({
                            fid: item.fid,
                            name: item.file_name,
                            file_name: item.file_name,
                            size: item.size || 0,
                            isDir: false,
                            folderPath: folderName,
                            fullPath: folderName ? `${folderName}/${item.file_name}` : item.file_name
                        });
                    }
                }

                hasMore = result.hasMore && allFiles.length < CONFIG.FOLDER_MAX_FILES;
                page++;
            }

            return { files: allFiles, warning };
        },

        formatSize: (bytes) => {
            if (bytes === 0) return '0 B';
            const k = 1024, i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];
        },

        formatDate: (timestamp) => {
            const d = new Date(timestamp);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        },

        getFileType: (filename) => {
            const ext = filename.split('.').pop().toLowerCase();
            const types = {
                video: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'rmvb', 'rm', 'm4v', '3gp'],
                audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'ape'],
                image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff'],
                document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'csv'],
                archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz']
            };

            for (const [type, exts] of Object.entries(types)) {
                if (exts.includes(ext)) return type;
            }
            return 'other';
        },

        getFileIcon: (filename) => {
            const type = Utils.getFileType(filename);
            const icons = {
                video: ICON('play', 'quark-type-icon video'),
                audio: ICON('music', 'quark-type-icon audio'),
                image: ICON('image', 'quark-type-icon image'),
                document: ICON('fileText', 'quark-type-icon document'),
                archive: ICON('archive', 'quark-type-icon archive'),
                other: ICON('file', 'quark-type-icon other')
            };
            return icons[type] || icons.other;
        },

        sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

        getShareToken: async (pwdId, passcode = '') => {
            const res = await Utils.fetchJsonInPageContext(CONFIG.SHARE_TOKEN_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8'
                },
                body: JSON.stringify({
                    pwd_id: pwdId,
                    passcode: passcode || '',
                    support_visit_limit_private_share: true
                })
            });
            const stoken = res?.data?.stoken || '';
            if (!stoken) {
                throw new Error(res?.message || '未获取到分享访问令牌');
            }
            return stoken;
        },

        resolveShareToken: async (pwdId, initialPasscode = '', fallbackToken = '') => {
            const L = State.getLang();
            let lastError = null;

            const tryGetFormalToken = async (passcode = '') => {
                try {
                    return await Utils.getShareToken(pwdId, passcode);
                } catch (error) {
                    lastError = error;
                    return '';
                }
            };

            const formalToken = await tryGetFormalToken(initialPasscode);
            if (formalToken) return formalToken;

            if (!initialPasscode) {
                const promptedPasscode = window.prompt(L.sharePasscodePrompt, '')?.trim() || '';
                if (promptedPasscode) {
                    const retryToken = await tryGetFormalToken(promptedPasscode);
                    if (retryToken) return retryToken;
                }
            }

            if (fallbackToken) {
                try {
                    await Utils.getShareFileList(pwdId, fallbackToken, '0', 1, 1);
                    return fallbackToken;
                } catch (error) {
                    lastError = error;
                }
            }

            throw lastError || new Error('未获取到有效分享令牌');
        },

        getShareFileList: async (pwdId, stoken, pdirFid = '0', page = 1, pageSize = 100) => {
            const params = new URLSearchParams({
                pwd_id: pwdId,
                stoken: stoken,
                pdir_fid: pdirFid,
                force: '0',
                _page: String(page),
                _size: String(pageSize),
                _fetch_banner: '0',
                _fetch_share: '1',
                _fetch_total: '1',
                _sort: 'file_type:asc,file_name:asc'
            });
            const res = await Utils.fetchJsonInPageContext(`${CONFIG.SHARE_DETAIL_API}&${params.toString()}`);
            const list = res?.data?.list || [];
            const total = res?.metadata?._total || list.length;
            return {
                list,
                total,
                hasMore: page * pageSize < total
            };
        },

        getAllShareFiles: async (pwdId, stoken, pdirFid = '0', folderName = '', depth = 0) => {
            const allItems = [];
            let warning = null;
            if (depth > CONFIG.FOLDER_MAX_DEPTH) {
                return { items: [], warning: 'depth' };
            }

            let page = 1;
            const pageSize = 100;
            while (true) {
                const pageData = await Utils.getShareFileList(pwdId, stoken, pdirFid, page, pageSize);
                for (const item of pageData.list) {
                    const isDir = item.file_type === 0 || item.dir === true || item.is_dir === true || item.obj_category === 'folder';
                    const currentPath = folderName ? `${folderName}/${item.file_name}` : item.file_name;
                    const mappedItem = {
                        fid: item.fid,
                        file_name: item.file_name,
                        name: item.file_name,
                        file_type: isDir ? 0 : 1,
                        isDir,
                        size: item.size || 0,
                        pdir_fid: item.pdir_fid || pdirFid || '0',
                        share_fid_token: item.share_fid_token || '',
                        folderPath: folderName,
                        fullPath: currentPath,
                        download_url: item.download_url || ''
                    };
                    allItems.push(mappedItem);

                    if (isDir) {
                        const sub = await Utils.getAllShareFiles(pwdId, stoken, item.fid, currentPath, depth + 1);
                        allItems.push(...sub.items);
                        if (sub.warning) warning = sub.warning;
                    }

                    if (allItems.length >= CONFIG.FOLDER_MAX_FILES) {
                        warning = 'count';
                        break;
                    }
                }

                if (warning === 'count' || !pageData.hasMore) break;
                page += 1;
            }

            return { items: allItems, warning };
        },

        listFiles: async (folderId = '0', page = 1, pageSize = 100) => {
            const url = `${CONFIG.FOLDER_LIST_API}${folderId}&_page=${page}&_size=${pageSize}&_sort=file_type:asc,file_name:asc`;
            const res = await Utils.get(url);
            const list = res?.data?.list || [];
            const total = res?.metadata?._total || list.length;
            return {
                list,
                total,
                hasMore: page * pageSize < total
            };
        },

        listAllFiles: async (folderId = '0') => {
            const items = [];
            let page = 1;
            while (true) {
                const pageData = await Utils.listFiles(folderId, page, 200);
                items.push(...pageData.list);
                if (!pageData.hasMore) break;
                page += 1;
            }
            return items;
        },

        listFolderTree: async (folderId = '0', folderPath = '') => {
            const directItems = await Utils.listAllFiles(folderId);
            const treeItems = [];

            for (const item of directItems) {
                const isDir = item.file_type === 0 || item.dir === true || item.is_dir === true;
                const currentPath = folderPath ? `${folderPath}/${item.file_name}` : item.file_name;
                const mappedItem = {
                    fid: item.fid,
                    file_name: item.file_name,
                    size: item.size || 0,
                    file_type: isDir ? 0 : 1,
                    isDir,
                    folderPath,
                    fullPath: currentPath
                };
                treeItems.push(mappedItem);

                if (isDir) {
                    const descendants = await Utils.listFolderTree(item.fid, currentPath);
                    treeItems.push(...descendants);
                }
            }

            return treeItems;
        },

        createFolder: async (folderName, parentId = '0') => {
            const res = await Utils.post(CONFIG.FILE_CREATE_API, {
                pdir_fid: parentId,
                file_name: folderName,
                dir_init_lock: false,
                dir_path: ''
            });
            const fid = res?.data?.fid;
            if (!fid) {
                throw new Error(res?.message || '创建文件夹失败');
            }
            return fid;
        },

        ensureShareTargetFolder: async (preferredFolderId = '', cachedRootItems = null) => {
            if (preferredFolderId) return preferredFolderId;
            const rootItems = cachedRootItems || await Utils.listAllFiles('0');
            const found = rootItems.find(item => (item.file_type === 0 || item.dir === true || item.is_dir === true) && item.file_name === CONFIG.SHARE_SAVE_ROOT_NAME);
            if (found?.fid) return found.fid;
            return Utils.createFolder(CONFIG.SHARE_SAVE_ROOT_NAME, '0');
        },

        getShareTargetFolderOptions: async (selectedFolderId = '', cachedRootItems = null) => {
            const rootItems = cachedRootItems || await Utils.listAllFiles('0');
            const options = rootItems
                .filter(item => item.file_type === 0 || item.dir === true || item.is_dir === true)
                .map(item => ({
                    id: item.fid,
                    name: item.file_name
                }));

            if (selectedFolderId && !options.some(option => option.id === selectedFolderId)) {
                options.unshift({
                    id: selectedFolderId,
                    name: CONFIG.SHARE_SAVE_ROOT_NAME
                });
            }

            return options;
        },

        waitForTask: async (taskId, timeout = 60000) => {
            if (!taskId) return true;
            const start = Date.now();
            let retryIndex = 0;
            while (Date.now() - start < timeout) {
                const params = new URLSearchParams({ task_id: taskId, retry_index: String(retryIndex) });
                const res = await Utils.fetchJsonInPageContext(`${CONFIG.TASK_API}&${params.toString()}`);
                const status = Number(res?.data?.status);
                if (status === 2) return true;
                if (status === 3) {
                    throw new Error(res?.data?.message || '任务失败');
                }
                retryIndex += 1;
                await Utils.sleep(1000);
            }
            throw new Error('任务超时');
        },

        getShareDownloadSettleConfig: (transferResult = {}) => {
            const expectedCount = Math.max(0, Number(transferResult?.expectedDownloadFileCount || 0));
            const selectedRootCount = Array.isArray(transferResult?.selectedRootItems) ? transferResult.selectedRootItems.length : 0;
            const hasDirectoryRoot = (transferResult?.selectedRootItems || []).some(item => item?.isDir || item?.file_type === 0);
            const reuseExistingRootCount = Array.isArray(transferResult?.reusedTargetRoots) ? transferResult.reusedTargetRoots.length : 0;

            if (expectedCount >= 200 || (hasDirectoryRoot && expectedCount >= 100)) {
                return { maxAttempts: 16, delayMs: 800, stableRounds: 2, maxWaitMs: 20000 };
            }
            if (expectedCount >= 50 || hasDirectoryRoot || reuseExistingRootCount > 0 || selectedRootCount >= 10) {
                return { maxAttempts: 10, delayMs: 600, stableRounds: 2, maxWaitMs: 12000 };
            }
            return { maxAttempts: 6, delayMs: 500, stableRounds: 1, maxWaitMs: 5000 };
        },

        describeMissingTransferredFiles: (transferResult = {}, files = []) => {
            const selectedRootItems = Array.isArray(transferResult?.selectedRootItems) ? transferResult.selectedRootItems : [];
            const discoveredPaths = new Set(
                (Array.isArray(files) ? files : [])
                    .map(file => String(file?.fullPath || file?.file_name || '').trim())
                    .filter(Boolean)
            );
            const expectedPaths = Utils.expandSelectedFolders(
                selectedRootItems.map(item => String(item?.fid || '')).filter(Boolean),
                Array.isArray(State.shareTreeData) ? State.shareTreeData : []
            )
                .filter(item => !(item?.isDir || item?.file_type === 0))
                .map(item => String(item?.fullPath || item?.file_name || '').trim())
                .filter(Boolean);

            const missingPaths = [];
            expectedPaths.forEach(path => {
                if (!discoveredPaths.has(path)) {
                    missingPaths.push(path);
                }
            });

            return {
                expectedPaths,
                missingPaths,
                missingPreview: missingPaths.slice(0, 20)
            };
        },

        orderShareItemsByPath: (items = []) => {
            return [...items].sort((a, b) => {
                const pathA = String(a?.fullPath || a?.file_name || '');
                const pathB = String(b?.fullPath || b?.file_name || '');
                const depthA = pathA ? pathA.split('/').length : 0;
                const depthB = pathB ? pathB.split('/').length : 0;
                return pathA.localeCompare(pathB, 'zh-Hans-CN', { numeric: true, sensitivity: 'base' }) || depthA - depthB;
            });
        },

        buildShareTreeRenderMeta: (items = []) => {
            const orderedItems = Utils.orderShareItemsByPath(items);
            const siblingGroups = orderedItems.reduce((map, item) => {
                const currentPath = String(item?.fullPath || item?.file_name || '').trim();
                const segments = currentPath.split('/').filter(Boolean);
                const parentPath = segments.slice(0, -1).join('/');
                if (!map.has(parentPath)) map.set(parentPath, []);
                map.get(parentPath).push(currentPath);
                return map;
            }, new Map());

            const lastSiblingByParent = new Map(
                Array.from(siblingGroups.entries()).map(([parentPath, paths]) => [parentPath, paths[paths.length - 1] || ''])
            );

            return orderedItems.map(item => {
                const currentPath = String(item?.fullPath || item?.file_name || '').trim();
                const segments = currentPath.split('/').filter(Boolean);
                const parentPath = segments.slice(0, -1).join('/');
                const depth = Math.max(0, segments.length - 1);
                const guideColumns = [];

                for (let index = 0; index < depth; index += 1) {
                    const ancestorPath = segments.slice(0, index + 1).join('/');
                    const ancestorParentPath = segments.slice(0, index).join('/');
                    if (lastSiblingByParent.get(ancestorParentPath) !== ancestorPath) {
                        guideColumns.push(index);
                    }
                }

                const guideStyle = guideColumns.length
                    ? guideColumns.map(index => `linear-gradient(90deg, transparent ${index * 16 + 15}px, rgba(102,126,234,0.22) ${index * 16 + 15}px, rgba(102,126,234,0.22) ${index * 16 + 16}px, transparent ${index * 16 + 16}px)`).join(',')
                    : 'none';

                return {
                    ...item,
                    __shareDepth: depth,
                    __shareParentPath: parentPath,
                    __shareIsLastSibling: lastSiblingByParent.get(parentPath) === currentPath,
                    __shareGuideColumns: guideColumns.join(','),
                    __shareGuideStyle: guideStyle
                };
            });
        },

        mergeShareItems: (existingItems = [], incomingItems = []) => {
            const merged = [];
            const runtimeState = { indexByFid: new Map() };
            existingItems.forEach(item => {
                Utils.upsertShareItem(merged, item, runtimeState);
            });
            incomingItems.forEach(item => {
                Utils.upsertShareItem(merged, item, runtimeState);
            });
            return Utils.orderShareItemsByPath(merged);
        },

        filterSelectedShareItems: (selectedIds = [], allItems = []) => {
            const selectedSet = new Set(selectedIds);
            const itemMap = new Map(allItems.map(item => [item.fid, item]));
            return allItems.filter(item => {
                if (!selectedSet.has(item.fid)) return false;
                if (item.pdir_fid) {
                    let parentId = item.pdir_fid;
                    while (parentId && parentId !== '0') {
                        if (selectedSet.has(parentId)) return false;
                        parentId = itemMap.get(parentId)?.pdir_fid;
                    }
                }
                return true;
            });
        },

        expandSelectedFolders: (selectedIds = [], allItems = []) => {
            const selectedSet = new Set(selectedIds);
            const folderPaths = new Map();
            allItems.forEach(item => {
                if (selectedSet.has(String(item.fid)) && (item.isDir || item.file_type === 0)) {
                    folderPaths.set(String(item.fid), item.fullPath || item.file_name || '');
                }
            });
            if (folderPaths.size === 0) return allItems.filter(f => selectedSet.has(String(f.fid)));
            const expandedFids = new Set();
            allItems.forEach(item => {
                const fid = String(item.fid);
                if (item.isDir || item.file_type === 0) return;
                if (selectedSet.has(fid)) { expandedFids.add(fid); return; }
                const itemPath = item.fullPath || item.file_name || '';
                for (const [fid, fPath] of folderPaths) {
                    if (itemPath.startsWith(fPath + '/') || itemPath === fPath) {
                        expandedFids.add(fid);
                        break;
                    }
                }
            });
            return allItems.filter(f => expandedFids.has(String(f.fid)));
        },

        groupShareItemsByPdirFid: (items = []) => {
            return items.reduce((map, item) => {
                const key = item.pdir_fid || '0';
                if (!map.has(key)) map.set(key, []);
                map.get(key).push(item);
                return map;
            }, new Map());
        },

        estimateShareDownloadFileCount: (selectedItems = [], allItems = []) => {
            if (!Array.isArray(selectedItems) || selectedItems.length === 0) return 0;
            if (!Array.isArray(allItems) || allItems.length === 0) return 0;

            const selectedIds = selectedItems.map(item => String(item?.fid || '')).filter(Boolean);
            if (selectedIds.length === 0) return 0;

            const rootSelectedItems = Utils.filterSelectedShareItems(selectedIds, allItems);
            const rootSelectedIds = rootSelectedItems.map(item => String(item?.fid || '')).filter(Boolean);
            if (rootSelectedIds.length === 0) return 0;

            const expandedItems = Utils.expandSelectedFolders(rootSelectedIds, allItems);
            return expandedItems.filter(item => !(item?.isDir || item?.file_type === 0)).length;
        },

        captureReusedTargetRoots: async (selectedRootItems = [], beforeItems = []) => {
            if (!Array.isArray(selectedRootItems) || selectedRootItems.length === 0) return [];
            if (!Array.isArray(beforeItems) || beforeItems.length === 0) return [];

            const seenKeys = new Set();
            const tasks = [];

            for (const selectedRoot of selectedRootItems) {
                const isDir = selectedRoot?.isDir || selectedRoot?.file_type === 0;
                if (!isDir) continue;

                const key = `${selectedRoot.file_name}::0`;
                if (seenKeys.has(key)) continue;
                seenKeys.add(key);

                const existingRoot = beforeItems.find(item => (item.file_type === 0 || item.dir === true || item.is_dir === true) && item.file_name === selectedRoot.file_name);
                if (!existingRoot?.fid) continue;

                tasks.push(Utils.listFolderTree(existingRoot.fid, selectedRoot.fullPath || selectedRoot.file_name).then(beforeDescendants => ({
                    fid: existingRoot.fid,
                    file_name: existingRoot.file_name,
                    size: existingRoot.size || 0,
                    file_type: 0,
                    isDir: true,
                    fullPath: selectedRoot.fullPath || existingRoot.file_name,
                    beforeDescendants
                })));
            }

            return Promise.all(tasks);
        },


        hydrateShareTransferMetadata: async (items = [], shareContext = {}) => {
            if (!Array.isArray(items) || !items.length) {
                return items;
            }

            let authoritativeItemMap = shareContext.authoritativeItemMap instanceof Map
                ? shareContext.authoritativeItemMap
                : null;

            if ((!authoritativeItemMap || authoritativeItemMap.size === 0) && shareContext?.pwdId && shareContext?.token) {
                try {
                    const shareResult = await Utils.getAllShareFiles(shareContext.pwdId, shareContext.token, '0');
                    const authoritativeItems = shareResult.items || [];
                    if (authoritativeItems.length > 0) {
                        State.shareTreeData = authoritativeItems;
                    }
                    authoritativeItemMap = new Map(authoritativeItems.map(item => [item.fid, item]));
                } catch (error) {
                    Utils.log('补全分享转存元数据失败:', error);
                }
            }

            if (!authoritativeItemMap || authoritativeItemMap.size === 0) {
                return items;
            }

            return items.map(item => {
                const authoritativeItem = authoritativeItemMap.get(item.fid) || {};
                return {
                    ...authoritativeItem,
                    ...item,
                    file_type: authoritativeItem.file_type ?? item.file_type ?? 1,
                    isDir: authoritativeItem.isDir ?? item.isDir ?? authoritativeItem.file_type === 0,
                    size: authoritativeItem.size || item.size || 0,
                    pdir_fid: authoritativeItem.pdir_fid || item.pdir_fid || '0',
                    share_fid_token: authoritativeItem.share_fid_token || item.share_fid_token || '',
                    fullPath: authoritativeItem.fullPath || item.fullPath || item.file_name,
                    folderPath: authoritativeItem.folderPath || item.folderPath || ''
                };
            });
        },

        transferShareItems: async (items, shareContext) => {
            const targetFolderId = await Utils.ensureShareTargetFolder(shareContext.targetFolderId || '');
            const beforeItems = await Utils.listAllFiles(targetFolderId);
            const selectedRootItems = Array.isArray(items) ? items.map(item => ({ ...item })) : [];
            const authoritativeItems = Array.isArray(shareContext?.authoritativeItems) && shareContext.authoritativeItems.length > 0
                ? shareContext.authoritativeItems
                : (Array.isArray(State.shareTreeData) ? State.shareTreeData : []);
            const expectedDownloadFileCount = Utils.estimateShareDownloadFileCount(selectedRootItems, authoritativeItems);
            const reusedTargetRoots = await Utils.captureReusedTargetRoots(selectedRootItems, beforeItems);

            const groups = Utils.groupShareItemsByPdirFid(items);
            for (const [pdirFid, groupItems] of groups.entries()) {
                const res = await Utils.fetchJsonInPageContext(CONFIG.SHARE_SAVE_API, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json;charset=UTF-8'
                    },
                    body: JSON.stringify({
                        fid_list: groupItems.map(item => item.fid),
                        fid_token_list: groupItems.map(item => item.share_fid_token || ''),
                        to_pdir_fid: targetFolderId,
                        pwd_id: shareContext.pwdId,
                        stoken: shareContext.token,
                        pdir_fid: pdirFid,
                        pdir_save_all: false,
                        exclude_fids: [],
                        scene: 'link'
                    })
                });
                if (res?.code !== 0) {
                    throw new Error(res?.message || '保存分享文件失败');
                }
                if (res?.data?.task_id) {
                    await Utils.waitForTask(res.data.task_id);
                }
            }

            const newTopLevelItems = await Utils.findTransferredItems({
                targetFolderId,
                beforeItems,
                selectedRootItems,
                reusedTargetRoots
            });

            return { targetFolderId, beforeItems, newTopLevelItems, selectedRootItems, expectedDownloadFileCount, reusedTargetRoots };
        },

        findTransferredItems: async (transferResult) => {
            if (!transferResult?.targetFolderId) return [];

            const beforeFids = new Set((transferResult.beforeItems || []).map(item => item.fid));
            const selectedRootItems = transferResult.selectedRootItems || [];
            const selectedRootMap = new Map(
                selectedRootItems.map(item => [`${item.file_name}::${item.file_type || (item.isDir ? 0 : 1)}`, item])
            );
            const settleConfig = Utils.getShareDownloadSettleConfig(transferResult);
            const startTime = Date.now();

            for (let attempt = 0; attempt < settleConfig.maxAttempts; attempt += 1) {
                const afterItems = await Utils.listAllFiles(transferResult.targetFolderId);
                const newTopLevelItems = afterItems.filter(item => !beforeFids.has(item.fid));
                const resolvedNewTopLevelItems = newTopLevelItems.map(item => {
                    const typeKey = `${item.file_name}::${item.file_type || (item.dir === true || item.is_dir === true ? 0 : 1)}`;
                    const selectedRoot = selectedRootMap.get(typeKey);
                    return {
                        fid: item.fid,
                        file_name: item.file_name,
                        size: item.size || 0,
                        file_type: item.file_type || 1,
                        isDir: item.file_type === 0 || item.dir === true || item.is_dir === true,
                        folderPath: '',
                        fullPath: selectedRoot?.fullPath || item.file_name
                    };
                });

                const mergedExistingRoots = await Promise.all((transferResult.reusedTargetRoots || []).map(async (reusedRoot) => {
                    const beforeDescendantFids = new Set((reusedRoot.beforeDescendants || []).map(item => item.fid));
                    const afterDescendants = await Utils.listFolderTree(reusedRoot.fid, reusedRoot.fullPath || reusedRoot.file_name);
                    const mergedDescendantItems = afterDescendants.filter(item => !beforeDescendantFids.has(item.fid));
                    if (afterDescendants.length > 0) {
                        return {
                            fid: reusedRoot.fid,
                            file_name: reusedRoot.file_name,
                            size: reusedRoot.size || 0,
                            file_type: 0,
                            isDir: true,
                            folderPath: '',
                            fullPath: reusedRoot.fullPath || reusedRoot.file_name,
                            reuseExistingTarget: true,
                            completeDescendantItems: afterDescendants,
                            mergedDescendantItems,
                            mergedDescendantFids: mergedDescendantItems.map(item => item.fid)
                        };
                    }
                    return null;
                })).then(results => results.filter(Boolean));

                const combinedItems = [...resolvedNewTopLevelItems];
                const existingCombinedFids = new Set(combinedItems.map(item => item.fid));
                for (const mergedRoot of mergedExistingRoots) {
                    if (existingCombinedFids.has(mergedRoot.fid)) continue;
                    combinedItems.push(mergedRoot);
                    existingCombinedFids.add(mergedRoot.fid);
                }

                if (combinedItems.length > 0) {
                    return combinedItems;
                }
                if (Date.now() - startTime >= settleConfig.maxWaitMs) {
                    break;
                }
                await Utils.sleep(settleConfig.delayMs);
            }

            return [];
        },

        expandTransferredItemsToFiles: async (items = [], parentPath = '') => {
            const fileItems = [];
            const dirTasks = [];

            for (const item of items) {
                const currentPath = parentPath ? `${parentPath}/${item.file_name}` : (item.fullPath || item.file_name);
                if (item.isDir || item.file_type === 0) {
                    dirTasks.push(
                        Utils.listAllFiles(item.fid).then(children => {
                            const mappedChildren = children.map(child => ({
                                fid: child.fid,
                                file_name: child.file_name,
                                size: child.size || 0,
                                file_type: child.file_type || 1,
                                isDir: child.file_type === 0 || child.dir === true || child.is_dir === true
                            }));
                            return Utils.expandTransferredItemsToFiles(mappedChildren, currentPath);
                        })
                    );
                } else {
                    fileItems.push({
                        fid: item.fid,
                        file_name: item.file_name,
                        size: item.size || 0,
                        folderPath: parentPath,
                        fullPath: currentPath
                    });
                }
            }

            if (dirTasks.length === 0) return fileItems;
            const dirResults = await Promise.all(dirTasks);
            for (const subFiles of dirResults) {
                fileItems.push(...subFiles);
            }
            return fileItems;
        },

        describeTransferredTopItems: (items = []) => {
            return (Array.isArray(items) ? items : []).map(item => ({
                fid: item?.fid || '',
                file_name: item?.file_name || '',
                fullPath: item?.fullPath || item?.file_name || '',
                isDir: Boolean(item?.isDir || item?.file_type === 0),
                reuseExistingTarget: Boolean(item?.reuseExistingTarget)
            }));
        },

        resolveTransferredTargetRoots: async (transferResult) => {
            const targetFolderId = transferResult?.targetFolderId || '0';
            const selectedRootItems = Array.isArray(transferResult?.selectedRootItems) ? transferResult.selectedRootItems : [];
            if (!selectedRootItems.length) return [];

            const beforeFids = new Set((transferResult?.beforeItems || []).map(item => String(item?.fid || '')));
            const afterRootItems = await Utils.listAllFiles(targetFolderId);
            const usedRootFids = new Set();
            const resolvedRoots = [];

            for (const selectedRoot of selectedRootItems) {
                const selectedName = String(selectedRoot?.file_name || '');
                const selectedIsDir = Boolean(selectedRoot?.isDir || selectedRoot?.file_type === 0);
                const candidates = afterRootItems.filter(item => {
                    const candidateFid = String(item?.fid || '');
                    const candidateIsDir = item?.file_type === 0 || item?.dir === true || item?.is_dir === true;
                    if (!candidateFid || usedRootFids.has(candidateFid)) return false;
                    if (String(item?.file_name || '') !== selectedName) return false;
                    return selectedIsDir ? candidateIsDir : !candidateIsDir;
                });

                const preferredCandidate = candidates.find(item => !beforeFids.has(String(item?.fid || ''))) || candidates[0];
                if (!preferredCandidate?.fid) continue;

                const candidateFid = String(preferredCandidate.fid);
                const candidateIsDir = preferredCandidate.file_type === 0 || preferredCandidate.dir === true || preferredCandidate.is_dir === true;
                resolvedRoots.push({
                    fid: preferredCandidate.fid,
                    file_name: preferredCandidate.file_name,
                    size: preferredCandidate.size || 0,
                    file_type: candidateIsDir ? 0 : 1,
                    isDir: candidateIsDir,
                    folderPath: '',
                    fullPath: selectedRoot.fullPath || preferredCandidate.file_name,
                    reuseExistingTarget: beforeFids.has(candidateFid)
                });
                usedRootFids.add(candidateFid);
            }

            if (!resolvedRoots.length && Array.isArray(transferResult?.newTopLevelItems) && transferResult.newTopLevelItems.length > 0) {
                console.warn('[夸克网盘下载助手] 根层匹配为空，回退使用转存识别结果:', {
                    selectedRoots: selectedRootItems.map(item => ({
                        fid: item?.fid || '',
                        file_name: item?.file_name || '',
                        fullPath: item?.fullPath || item?.file_name || '',
                        isDir: Boolean(item?.isDir || item?.file_type === 0)
                    })),
                    afterRootItems: afterRootItems.map(item => ({
                        fid: item?.fid || '',
                        file_name: item?.file_name || '',
                        file_type: item?.file_type,
                        isDir: item?.file_type === 0 || item?.dir === true || item?.is_dir === true,
                        isNew: !beforeFids.has(String(item?.fid || ''))
                    })),
                    fallbackRoots: Utils.describeTransferredTopItems(transferResult.newTopLevelItems)
                });
                return transferResult.newTopLevelItems;
            }

            if (!resolvedRoots.length) {
                console.warn('[夸克网盘下载助手] 根层匹配为空:', {
                    selectedRoots: selectedRootItems.map(item => ({
                        fid: item?.fid || '',
                        file_name: item?.file_name || '',
                        fullPath: item?.fullPath || item?.file_name || '',
                        isDir: Boolean(item?.isDir || item?.file_type === 0)
                    })),
                    afterRootItems: afterRootItems.map(item => ({
                        fid: item?.fid || '',
                        file_name: item?.file_name || '',
                        file_type: item?.file_type,
                        isDir: item?.file_type === 0 || item?.dir === true || item?.is_dir === true,
                        isNew: !beforeFids.has(String(item?.fid || ''))
                    }))
                });
            }

            return resolvedRoots;
        },

        recoverMissingTransferredFiles: async (transferResult, existingFiles = [], topItems = []) => {
            const missingSummary = Utils.describeMissingTransferredFiles(transferResult, existingFiles);
            if (!missingSummary.missingPaths.length || !Array.isArray(topItems) || topItems.length === 0) {
                return existingFiles;
            }

            const fileMap = new Map((Array.isArray(existingFiles) ? existingFiles : []).map(file => [file.fid, file]));
            const missingPathSet = new Set(missingSummary.missingPaths);

            for (const item of topItems) {
                if (!item?.fid) continue;

                if (item?.reuseExistingTarget && Array.isArray(item.completeDescendantItems)) {
                    item.completeDescendantItems.forEach(descendant => {
                        if (descendant?.isDir || descendant?.file_type === 0 || !descendant?.fid) return;
                        const descendantPath = String(descendant.fullPath || descendant.file_name || '').trim();
                        if (!missingPathSet.has(descendantPath)) return;
                        fileMap.set(descendant.fid, {
                            fid: descendant.fid,
                            file_name: descendant.file_name,
                            size: descendant.size || 0,
                            folderPath: descendant.folderPath || '',
                            fullPath: descendant.fullPath || descendant.file_name
                        });
                    });
                    continue;
                }

                if (item?.reuseExistingTarget && Array.isArray(item.mergedDescendantItems)) {
                    item.mergedDescendantItems.forEach(descendant => {
                        if (descendant?.isDir || descendant?.file_type === 0 || !descendant?.fid) return;
                        const descendantPath = String(descendant.fullPath || descendant.file_name || '').trim();
                        if (!missingPathSet.has(descendantPath)) return;
                        fileMap.set(descendant.fid, {
                            fid: descendant.fid,
                            file_name: descendant.file_name,
                            size: descendant.size || 0,
                            folderPath: descendant.folderPath || '',
                            fullPath: descendant.fullPath || descendant.file_name
                        });
                    });
                    continue;
                }

                const itemPath = String(item.fullPath || item.file_name || '').trim();
                const relevantMissingPaths = Array.from(missingPathSet).filter(path => path === itemPath || path.startsWith(`${itemPath}/`));
                if (!relevantMissingPaths.length) continue;

                if (!(item.isDir || item.file_type === 0)) {
                    if (missingPathSet.has(itemPath)) {
                        fileMap.set(item.fid, {
                            fid: item.fid,
                            file_name: item.file_name,
                            size: item.size || 0,
                            folderPath: item.folderPath || '',
                            fullPath: item.fullPath || item.file_name
                        });
                    }
                    continue;
                }

                const descendants = await Utils.listFolderTree(item.fid, item.fullPath || item.file_name);
                descendants.forEach(descendant => {
                    if (descendant?.isDir || descendant?.file_type === 0 || !descendant?.fid) return;
                    const descendantPath = String(descendant.fullPath || descendant.file_name || '').trim();
                    if (!missingPathSet.has(descendantPath)) return;
                    fileMap.set(descendant.fid, {
                        fid: descendant.fid,
                        file_name: descendant.file_name,
                        size: descendant.size || 0,
                        folderPath: descendant.folderPath || '',
                        fullPath: descendant.fullPath || descendant.file_name
                    });
                });
            }

            return Array.from(fileMap.values());
        },

        getDownloadLinksForTransferredItems: async (transferResult) => {
            let files = [];
            let lastVisibleFileCount = 0;
            let stableRounds = 0;
            let lastTopItems = [];
            const settleConfig = Utils.getShareDownloadSettleConfig(transferResult);
            const startTime = Date.now();
            const expectedDownloadFileCount = Math.max(0, Number(transferResult?.expectedDownloadFileCount || 0));

            for (let attempt = 0; attempt < settleConfig.maxAttempts; attempt += 1) {
                const resolvedRoots = await Utils.resolveTransferredTargetRoots(transferResult);
                lastTopItems = resolvedRoots;
                console.log('[夸克网盘下载助手] 转存目标根节点:', Utils.describeTransferredTopItems(resolvedRoots));

                if (resolvedRoots.length > 0) {
                    files = await Utils.expandTransferredItemsToFiles(resolvedRoots, '');
                    console.log('[夸克网盘下载助手] 转存递归展开文件数:', files.length, files.slice(0, 20).map(file => file.fullPath || file.file_name));
                }

                const hasDirectoryRoot = resolvedRoots.some(item => item?.isDir || item?.file_type === 0);

                if (expectedDownloadFileCount > 0) {
                    if (files.length >= expectedDownloadFileCount) break;
                    stableRounds = files.length === lastVisibleFileCount ? stableRounds + 1 : 0;
                    if (stableRounds >= settleConfig.stableRounds) {
                        break;
                    }
                } else if (files.length > 0) {
                    stableRounds = files.length === lastVisibleFileCount ? stableRounds + 1 : 0;
                    if (!hasDirectoryRoot || stableRounds >= settleConfig.stableRounds) break;
                }

                lastVisibleFileCount = Math.max(lastVisibleFileCount, files.length);
                if (Date.now() - startTime >= settleConfig.maxWaitMs) {
                    break;
                }

                if (resolvedRoots.length === 0 && attempt === 0) {
                    await Utils.sleep(settleConfig.delayMs);
                } else if (resolvedRoots.length > 0 && files.length < expectedDownloadFileCount) {
                    await Utils.sleep(settleConfig.delayMs);
                } else {
                    break;
                }
            }
            if (!files.length) return [];

            if (expectedDownloadFileCount > 0 && files.length < expectedDownloadFileCount) {
                const missingSummary = Utils.describeMissingTransferredFiles(transferResult, files);
                console.warn('[夸克网盘下载助手] 转存文件收敛不足:', {
                    expectedDownloadFileCount,
                    actualDownloadFileCount: files.length,
                    missingCount: missingSummary.missingPaths.length,
                    missingPreview: missingSummary.missingPreview
                });
                files = await Utils.recoverMissingTransferredFiles(transferResult, files, lastTopItems);
                console.warn('[夸克网盘下载助手] 转存文件补拉结果:', {
                    expectedDownloadFileCount,
                    actualDownloadFileCount: files.length
                });
            }

            const DOWNLOAD_BATCH_SIZE = 50;
            const allLinkedItems = [];
            for (let batchStart = 0; batchStart < files.length; batchStart += DOWNLOAD_BATCH_SIZE) {
                const batchFiles = files.slice(batchStart, batchStart + DOWNLOAD_BATCH_SIZE);
                const batchRes = await Utils.post(CONFIG.API, { fids: batchFiles.map(file => file.fid) });
                if (!batchRes || batchRes.code !== 0 || !Array.isArray(batchRes.data)) {
                    throw new Error(batchRes?.message || '未获取到下载链接');
                }
                const batchFileMap = new Map(batchFiles.map(file => [file.fid, file]));
                allLinkedItems.push(...batchRes.data.map(item => ({
                    ...item,
                    folderPath: batchFileMap.get(item.fid)?.folderPath || '',
                    fullPath: batchFileMap.get(item.fid)?.fullPath || item.file_name
                })));
            }
            console.log('[夸克网盘下载助手] 下载链接批次完成:', {
                fileCount: files.length,
                linkCount: allLinkedItems.length,
                pathPreview: files.slice(0, 20).map(file => file.fullPath || file.file_name)
            });
            return allLinkedItems;
        },

        deleteTransferredItems: async (transferResult) => {
            if (!Array.isArray(transferResult?.newTopLevelItems) || transferResult.newTopLevelItems.length === 0) return true;

            const cleanupFids = transferResult.newTopLevelItems.flatMap(item => {
                if (item?.reuseExistingTarget) {
                    return Array.isArray(item.mergedDescendantFids) ? item.mergedDescendantFids : [];
                }
                return item?.fid ? [item.fid] : [];
            }).filter(Boolean);

            if (cleanupFids.length === 0) return true;

            const res = await Utils.post(CONFIG.FILE_DELETE_API, {
                action_type: 2,
                filelist: cleanupFids,
                exclude_fids: []
            });
            if (res?.code !== 0) {
                throw new Error(res?.message || '删除转存文件失败');
            }
            return true;
        },

        resolveShareDownloadContext: async (context = {}) => {
            const activeShareParams = context.shareParams || Utils.getShareParams();
            const activePwdId = context.pwdId || State.sharePwdId || activeShareParams.pwdId || '';
            let activeShareToken = context.token || State.shareToken || activeShareParams.stoken || Utils.getShareTokenFromPageState() || '';
            if (!activeShareToken && activePwdId) {
                try {
                    activeShareToken = await Utils.getShareToken(activePwdId, activeShareParams.passcode || '');
                } catch (error) {
                    Utils.log('分享 token 刷新失败:', error);
                }
            }
            if (!activePwdId || !activeShareToken) {
                throw new Error('未获取到分享访问令牌');
            }
            State.sharePwdId = activePwdId;
            State.shareToken = activeShareToken;
            let authoritativeItems = Array.isArray(context.authoritativeItems) ? context.authoritativeItems : [];
            if (!authoritativeItems.length && activePwdId && activeShareToken) {
                try {
                    const shareResult = await Utils.getAllShareFiles(activePwdId, activeShareToken, '0');
                    authoritativeItems = shareResult.items || [];
                    if (authoritativeItems.length > 0) {
                        State.shareTreeData = authoritativeItems;
                    }
                } catch (error) {
                    Utils.log('获取权威分享树失败:', error);
                }
            }
            const authoritativeItemMap = context.authoritativeItemMap instanceof Map
                ? context.authoritativeItemMap
                : new Map(authoritativeItems.map(item => [item.fid, item]));
            return {
                ...context,
                lang: context.lang || State.getLang(),
                shareParams: activeShareParams,
                pwdId: activePwdId,
                token: activeShareToken,
                targetFolderId: context.targetFolderId || State.shareTargetFolderId,
                cleanMode: context.cleanMode || State.shareDownloadMode,
                authoritativeItems,
                authoritativeItemMap
            };
        },

        runSingleShareDownloadTask: async (item, action, context = {}) => {
            const taskContext = context.pwdId && context.token ? context : await Utils.resolveShareDownloadContext(context);
            const L = taskContext.lang || State.getLang();
            if (!item) {
                throw new Error(L.shareSelectTip);
            }
            if (context.showPreparing !== false) {
                Utils.toast(L.sharePreparing, 'info');
            }

            const buildTransferContext = (token) => ({
                pwdId: taskContext.pwdId,
                token,
                targetFolderId: taskContext.targetFolderId || State.shareTargetFolderId,
                authoritativeItems: taskContext.authoritativeItems,
                authoritativeItemMap: taskContext.authoritativeItemMap
            });

            let activeShareToken = taskContext.token;
            let hydratedSelectedItems = await Utils.hydrateShareTransferMetadata([item], buildTransferContext(activeShareToken));

            let transferResult;
            try {
                transferResult = await Utils.transferShareItems(hydratedSelectedItems, buildTransferContext(activeShareToken));
            } catch (error) {
                const shouldRefreshToken = error?.status === 403 || /403/.test(String(error?.message || ''));
                if (!shouldRefreshToken) {
                    throw error;
                }
                activeShareToken = await Utils.getShareToken(taskContext.pwdId, taskContext.shareParams?.passcode || '');
                State.shareToken = activeShareToken;
                taskContext.token = activeShareToken;
                const retriedSelectedItems = await Utils.hydrateShareTransferMetadata([item], buildTransferContext(activeShareToken));
                hydratedSelectedItems = retriedSelectedItems;
                transferResult = await Utils.transferShareItems(retriedSelectedItems, buildTransferContext(activeShareToken));
            }

            State.shareTransferredItems = [...State.shareTransferredItems, transferResult];
            const linkedItems = await Utils.getDownloadLinksForTransferredItems(transferResult);
            if (!linkedItems.length) {
                throw new Error('保存成功，但暂未获取到下载链接');
            }
            await action(linkedItems, {
                ...taskContext,
                item,
                transferResult,
                hydratedSelectedItems
            });
            if ((context.cleanMode || State.shareDownloadMode) === 'clean' && !context.deferCleanup) {
                try {
                    await Utils.deleteTransferredItems(transferResult);
                } catch (error) {
                    Utils.toast(L.shareCleanupFailed, 'info');
                }
            }
            return { status: 'fulfilled', item, linkedItems, transferResult };
        },

        runConcurrentShareDownloads: async (items, action, options = {}) => {
            const queueItems = Array.isArray(items) ? items.filter(Boolean) : [];
            if (!queueItems.length) {
                return { results: [], successCount: 0, failedCount: 0, linkedItems: [], transferResults: [], errors: [] };
            }

            const sharedContext = await Utils.resolveShareDownloadContext({
                ...options.context,
                showPreparing: false
            });
            const L = sharedContext.lang || State.getLang();
            Utils.toast(L.sharePreparing, 'info');
            State.shareTransferredItems = [];

            const concurrency = Math.max(1, Number(options.concurrency || State.shareDownloadConcurrency || 3));
            const results = new Array(queueItems.length);
            let currentIndex = 0;

            const worker = async () => {
                while (currentIndex < queueItems.length) {
                    const taskIndex = currentIndex;
                    currentIndex += 1;
                    const item = queueItems[taskIndex];
                    try {
                        results[taskIndex] = await Utils.runSingleShareDownloadTask(item, action, sharedContext);
                    } catch (error) {
                        Utils.log('分享批量任务失败:', item, error);
                        results[taskIndex] = { status: 'rejected', item, reason: error };
                    }
                }
            };

            const workers = Array.from({ length: Math.min(concurrency, queueItems.length) }, () => worker());
            await Promise.all(workers);

            const fulfilledResults = results.filter(result => result?.status === 'fulfilled');
            const rejectedResults = results.filter(result => result?.status === 'rejected');
            return {
                results,
                successCount: fulfilledResults.length,
                failedCount: rejectedResults.length,
                linkedItems: fulfilledResults.flatMap(result => result.linkedItems || []),
                transferResults: fulfilledResults.map(result => result.transferResult).filter(Boolean),
                errors: rejectedResults.map(result => result.reason).filter(Boolean)
            };
        },

        executeShareDownloadAction: async (selectedItems, action, context = {}) => {
            const taskContext = await Utils.resolveShareDownloadContext(context);
            const L = taskContext.lang || State.getLang();
            if (!selectedItems || selectedItems.length === 0) {
                Utils.toast(L.shareSelectTip, 'error');
                return [];
            }

            console.log('[夸克网盘下载助手] executeShareDownloadAction 选中项目数:', selectedItems.length, selectedItems.map(f => f.file_name));

            const deduplicatedItems = Utils.filterSelectedShareItems(
                selectedItems.map(item => String(item.fid)),
                taskContext.authoritativeItems.length > 0 ? taskContext.authoritativeItems : selectedItems
            );
            console.log('[夸克网盘下载助手] 去重后项目数:', deduplicatedItems.length, deduplicatedItems.map(f => f.file_name));

            const buildTransferContext = (token) => ({
                pwdId: taskContext.pwdId,
                token,
                targetFolderId: taskContext.targetFolderId || State.shareTargetFolderId,
                authoritativeItems: taskContext.authoritativeItems,
                authoritativeItemMap: taskContext.authoritativeItemMap
            });

            Utils.toast(L.sharePreparing, 'info');
            let activeShareToken = taskContext.token;
            let hydratedItems = await Utils.hydrateShareTransferMetadata(deduplicatedItems, buildTransferContext(activeShareToken));
            console.log('[夸克网盘下载助手] 补全元数据后项目数:', hydratedItems.length);

            let transferResult;
            try {
                transferResult = await Utils.transferShareItems(hydratedItems, buildTransferContext(activeShareToken));
            } catch (error) {
                const shouldRefreshToken = error?.status === 403 || /403/.test(String(error?.message || ''));
                if (!shouldRefreshToken) throw error;
                activeShareToken = await Utils.getShareToken(taskContext.pwdId, taskContext.shareParams?.passcode || '');
                State.shareToken = activeShareToken;
                taskContext.token = activeShareToken;
                hydratedItems = await Utils.hydrateShareTransferMetadata(deduplicatedItems, buildTransferContext(activeShareToken));
                transferResult = await Utils.transferShareItems(hydratedItems, buildTransferContext(activeShareToken));
            }

            State.shareTransferredItems = [...State.shareTransferredItems, transferResult];
            const linkedItems = await Utils.getDownloadLinksForTransferredItems(transferResult);
            console.log('[夸克网盘下载助手] 获取下载链接数:', linkedItems.length);

            if (!linkedItems.length) {
                throw new Error('保存成功，但暂未获取到下载链接');
            }

            await action(linkedItems);
            console.log('[夸克网盘下载助手] 下载action执行完成, 链接数:', linkedItems.length);

            if (taskContext.cleanMode === 'clean') {
                try {
                    await Utils.deleteTransferredItems(transferResult);
                } catch (error) {
                    Utils.toast(L.shareCleanupFailed, 'info');
                }
            }

            Utils.toast(`${L.shareBatchComplete}：${L.shareBatchSucceeded} ${linkedItems.length} ${L.shareBatchItems}`, 'success');
            return linkedItems;
        },

        generateBatchLinks: (files) => {
            return files.map(f => f.download_url).join('\n');
        },

        generateAria2Commands: (files) => {
            return files.map(f => {
                const ua = CONFIG.UA;
                const outputPath = f.fullPath || f.file_name;
                const folderPath = f.folderPath || (outputPath.includes('/') ? outputPath.substring(0, outputPath.lastIndexOf('/')) : '');
                const dirCmd = folderPath ? `mkdir -p "${folderPath}" && ` : '';
                return `${dirCmd}aria2c -c -x 16 -s 16 "${f.download_url}" -o "${outputPath}" -U "${ua}" --header="Cookie: ${document.cookie}"`;
            }).join('\n\n');
        },

        generateCurlCommands: (files) => {
            return files.map(f => {
                const ua = CONFIG.UA;
                const outputPath = f.fullPath || f.file_name;
                const folderPath = f.folderPath || (outputPath.includes('/') ? outputPath.substring(0, outputPath.lastIndexOf('/')) : '');
                const dirCmd = folderPath ? `mkdir -p "${folderPath}" && ` : '';
                return `${dirCmd}curl -L -C - "${f.download_url}" -o "${outputPath}" -A "${ua}" -b "${document.cookie}"`;
            }).join('\n\n');
        },

        generateMotrixUrl: (file) => {
            if (!file?.download_url) return '';

            const outputPath = file.fullPath || file.file_name || '';
            const params = new URLSearchParams({
                uri: file.download_url,
                out: outputPath,
                userAgent: CONFIG.UA,
                cookie: document.cookie || '',
                silent: 'true'
            });

            return `mo://new-task?${params.toString()}`;
        },

        generateMotrixUrls: (files = []) => {
            return files
                .map(file => Utils.generateMotrixUrl(file))
                .filter(Boolean);
        },

        openUrlInPageContext: (url, options = {}) => {
            if (!url) return;
            const { target = '_blank', useLocation = false } = options;
            const script = document.createElement('script');
            script.textContent = `
                (() => {
                    const url = ${JSON.stringify(url)};
                    const target = ${JSON.stringify(target)};
                    const useLocation = ${useLocation ? 'true' : 'false'};
                    if (!url) return;
                    if (useLocation) {
                        window.location.href = url;
                        return;
                    }
                    const link = document.createElement('a');
                    link.href = url;
                    link.target = target;
                    link.rel = 'noopener noreferrer';
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                })();
            `;
            (document.head || document.documentElement).appendChild(script);
            script.remove();
        },

        motrixRpcRequest: (method, params = []) => {
            const rpcToken = String(State.motrixRpcToken || CONFIG.MOTRIX_RPC_TOKEN || '').trim();
            const rpcUrl = String(State.motrixRpcUrl || CONFIG.MOTRIX_RPC_URL || '').trim() || 'http://127.0.0.1:16800/jsonrpc';
            const rpcParams = rpcToken
                ? [`token:${rpcToken}`, ...params]
                : params;
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: rpcUrl,
                    headers: { 'Content-Type': 'application/json' },
                    data: JSON.stringify({
                        jsonrpc: '2.0',
                        id: Date.now(),
                        method,
                        params: rpcParams
                    }),
                    responseType: 'json',
                    timeout: 3000,
                    onload: res => {
                        const body = res.response || (typeof res.responseText === 'string' ? JSON.parse(res.responseText || '{}') : {});
                        if (res.status >= 200 && res.status < 300 && !body.error) {
                            resolve(body.result);
                            return;
                        }
                        reject(new Error(body.error?.message || `Motrix RPC 请求失败 (${res.status})`));
                    },
                    onerror: () => reject(new Error('Motrix RPC 未连接')),
                    ontimeout: () => reject(new Error('Motrix RPC 连接超时'))
                });
            });
        },

        checkMotrixRpc: async () => {
            await Utils.motrixRpcRequest('aria2.getVersion');
            return true;
        },

        sendFilesToMotrixRpc: async (files = []) => {
            await Utils.checkMotrixRpc();
            let sentCount = 0;
            for (const file of files) {
                if (!file?.download_url) continue;
                const outputPath = String(file.fullPath || file.file_name || '').split('/').filter(Boolean).join('/');
                const header = [
                    `Cookie: ${document.cookie || ''}`,
                    `User-Agent: ${CONFIG.UA}`,
                    `Referer: ${location.href}`
                ];
                const options = {
                    out: outputPath || file.file_name || '',
                    'user-agent': CONFIG.UA,
                    header
                };
                Object.keys(options).forEach(key => {
                    if (options[key] === undefined || options[key] === '') delete options[key];
                });
                console.log('[夸克网盘下载助手] Motrix RPC 添加任务:', { out: options.out, headers: header.length });
                await Utils.motrixRpcRequest('aria2.addUri', [[file.download_url], options]);
                sentCount += 1;
            }
            return sentCount;
        },

        openMotrix: (url) => {
            if (!url) return;
            const a = document.createElement('a');
            a.href = url;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        },

        openMotrixProtocolPrompt: () => {
            Utils.openMotrix('motrix://');
        },

        waitForMotrixRpc: async (timeout = 15000) => {
            const start = Date.now();
            while (Date.now() - start < timeout) {
                try {
                    await Utils.checkMotrixRpc();
                    return true;
                } catch (error) {
                    await Utils.sleep(1000);
                }
            }
            throw new Error('Motrix RPC 未连接');
        },

        sendFilesToMotrix: async (files = []) => {
            const urls = Utils.generateMotrixUrls(files);
            for (const url of urls) {
                Utils.openMotrix(url);
                await new Promise(resolve => setTimeout(resolve, 150));
            }
            return urls.length;
        },

        toast: (msg, type = 'success') => {
            const existingToast = document.querySelector('.quark-toast');
            if (existingToast) existingToast.remove();

            const div = document.createElement('div');
            div.className = 'quark-toast';
            div.innerText = msg;

            const colors = {
                success: '#2563EB',
                error: '#EF4444',
                info: '#0891B2'
            };

            div.style.cssText = `
                position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
                background: ${colors[type] || colors.success};
                color: white; padding: 10px 20px; border-radius: 8px; z-index: 2147483649;
                font-size: 13px; font-weight: 500; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                animation: quark-toast-in 0.2s ease-out;
                font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
            `;
            document.body.appendChild(div);
            setTimeout(() => {
                div.style.animation = 'quark-toast-out 0.3s ease-out forwards';
                setTimeout(() => div.remove(), 300);
            }, 2500);
        },

        debounce: (fn, delay) => {
            let timer = null;
            return function(...args) {
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => fn.apply(this, args), delay);
            };
        }
    };

    // ==================== 应用逻辑 ====================
    const App = {
        // 从全局状态获取选中的文件（解决虚拟滚动问题）
        getSelectedFilesFromState: () => {
            const files = [];

            try {
                // 方法1: 从 Redux store 获取
                const win = unsafeWindow || window;

                // 尝试获取 Redux store
                if (win.__REDUX_STORE__ || win.store || win.__store__) {
                    const store = win.__REDUX_STORE__ || win.store || win.__store__;
                    const state = store.getState?.();
                    Utils.log('Redux state:', state);

                    if (state?.file?.selectedFiles) {
                        return state.file.selectedFiles;
                    }
                    if (state?.selection?.selected) {
                        return state.selection.selected;
                    }
                }

                // 方法2: 从 React 根节点获取状态
                const rootEl = document.getElementById('root') || document.getElementById('app');
                if (rootEl) {
                    const fiberKey = Object.keys(rootEl).find(k =>
                        k.startsWith('__reactContainer$') ||
                        k.startsWith('__reactFiber$')
                    );

                    if (fiberKey) {
                        let fiber = rootEl[fiberKey];
                        let attempts = 0;

                        while (fiber && attempts < 50) {
                            const state = fiber.memoizedState;

                            // 查找包含选中文件信息的状态
                            if (state?.memoizedState?.selectedKeys ||
                                state?.memoizedState?.selectedRowKeys ||
                                state?.memoizedState?.checkedKeys) {
                                Utils.log('找到选中状态:', state.memoizedState);
                            }

                            // 查找文件列表状态
                            if (state?.memoizedState?.fileList ||
                                state?.memoizedState?.dataSource ||
                                state?.memoizedState?.list) {
                                const fileList = state.memoizedState.fileList ||
                                                state.memoizedState.dataSource ||
                                                state.memoizedState.list;
                                Utils.log('找到文件列表:', fileList?.length);
                            }

                            fiber = fiber.child || fiber.sibling || fiber.return;
                            attempts++;
                        }
                    }
                }

                // 方法3: 从全局变量获取
                const possibleVars = ['__INITIAL_STATE__', '__DATA__', '__APP_DATA__', 'pageData', 'appData'];
                for (const varName of possibleVars) {
                    if (win[varName]) {
                        Utils.log(`全局变量 ${varName}:`, win[varName]);
                        const data = win[varName];
                        if (data.selectedFiles) return data.selectedFiles;
                        if (data.file?.selectedFiles) return data.file.selectedFiles;
                        if (data.list?.selectedFiles) return data.list.selectedFiles;
                    }
                }

                // 方法4: 尝试从表格组件获取（Ant Design Table）
                const tableWrapper = document.querySelector('.ant-table-wrapper, [class*="table-wrapper"]');
                if (tableWrapper) {
                    const tableKey = Object.keys(tableWrapper).find(k =>
                        k.startsWith('__reactFiber$') || k.startsWith('__reactProps$')
                    );

                    if (tableKey) {
                        let fiber = tableWrapper[tableKey];
                        let attempts = 0;

                        while (fiber && attempts < 30) {
                            const props = fiber.memoizedProps || fiber.pendingProps;

                            // Ant Design Table 的 dataSource 和 selectedRowKeys
                            if (props?.dataSource && Array.isArray(props.dataSource)) {
                                const selectedKeys = props.rowSelection?.selectedRowKeys ||
                                                    props.selectedRowKeys || [];
                                Utils.log('Table dataSource:', props.dataSource.length, '选中:', selectedKeys.length);

                                if (selectedKeys.length > 0) {
                                    const selectedFiles = props.dataSource.filter(item =>
                                        selectedKeys.includes(item.fid || item.id || item.key)
                                    );

                                    if (selectedFiles.length > 0) {
                                        return selectedFiles.map(f => ({
                                            fid: f.fid || f.id || f.file_id,
                                            name: f.file_name || f.name || f.fileName || '未命名',
                                            isDir: f.dir === true || f.is_dir === true || f.type === 'folder',
                                            size: f.size || f.file_size || 0,
                                            download_url: f.download_url
                                        }));
                                    }
                                }
                            }

                            fiber = fiber.return;
                            attempts++;
                        }
                    }
                }

            } catch (e) {
                Utils.log('从状态获取文件失败:', e);
            }

            return files;
        },

        // 深度遍历 React Fiber 树获取所有选中文件
        getSelectedFilesFromFiberTree: () => {
            const files = [];
            const visited = new Set();

            try {
                const win = unsafeWindow || window;

                // 查找包含文件列表的组件
                const containers = document.querySelectorAll(
                    '.file-list, [class*="fileList"], [class*="FileList"], ' +
                    '.ant-table-body, [class*="table"], [class*="list-view"], ' +
                    '[class*="ListView"], [class*="content-list"]'
                );

                for (const container of containers) {
                    const key = Object.keys(container).find(k =>
                        k.startsWith('__reactFiber$') ||
                        k.startsWith('__reactInternalInstance$')
                    );

                    if (!key) continue;

                    // BFS 遍历 Fiber 树
                    const queue = [container[key]];
                    let iterations = 0;
                    const maxIterations = 500;

                    while (queue.length > 0 && iterations < maxIterations) {
                        iterations++;
                        const fiber = queue.shift();
                        if (!fiber || visited.has(fiber)) continue;
                        visited.add(fiber);

                        // 检查 memoizedProps
                        const props = fiber.memoizedProps || fiber.pendingProps || {};

                        // 查找 dataSource（完整数据列表）
                        if (props.dataSource && Array.isArray(props.dataSource) && props.dataSource.length > 0) {
                            const selectedKeys = props.rowSelection?.selectedRowKeys ||
                                                props.selectedRowKeys ||
                                                props.checkedKeys || [];

                            Utils.log('找到 dataSource:', props.dataSource.length, '选中keys:', selectedKeys.length);

                            if (selectedKeys.length > 0) {
                                for (const item of props.dataSource) {
                                    const itemKey = item.fid || item.id || item.key || item.file_id;
                                    if (selectedKeys.includes(itemKey)) {
                                        files.push({
                                            fid: item.fid || item.id || item.file_id,
                                            name: item.file_name || item.name || item.fileName || '未命名',
                                            isDir: item.dir === true || item.is_dir === true ||
                                                   item.type === 'folder' || item.obj_category === 'folder',
                                            size: item.size || item.file_size || 0,
                                            download_url: item.download_url
                                        });
                                    }
                                }
                            }
                        }

                        // 查找文件列表数据
                        if (props.list && Array.isArray(props.list)) {
                            Utils.log('找到 list:', props.list.length);
                        }

                        // 查找 items
                        if (props.items && Array.isArray(props.items)) {
                            Utils.log('找到 items:', props.items.length);
                        }

                        // 检查 memoizedState
                        let state = fiber.memoizedState;
                        while (state) {
                            if (state.memoizedState) {
                                const ms = state.memoizedState;
                                // 查找选中状态
                                if (ms.selectedRowKeys || ms.selectedKeys || ms.checkedKeys) {
                                    Utils.log('State 中找到选中keys:', ms.selectedRowKeys || ms.selectedKeys || ms.checkedKeys);
                                }
                                // 查找文件数据
                                if (ms.fileList || ms.dataSource || ms.list) {
                                    Utils.log('State 中找到文件列表');
                                }
                            }
                            state = state.next;
                        }

                        // 添加子节点到队列
                        if (fiber.child) queue.push(fiber.child);
                        if (fiber.sibling) queue.push(fiber.sibling);
                        if (fiber.return && !visited.has(fiber.return)) queue.push(fiber.return);
                    }
                }

                // 去重
                const uniqueFiles = [];
                const seenFids = new Set();
                for (const f of files) {
                    if (!seenFids.has(f.fid)) {
                        seenFids.add(f.fid);
                        uniqueFiles.push(f);
                    }
                }

                return uniqueFiles;

            } catch (e) {
                Utils.log('Fiber树遍历失败:', e);
            }

            return files;
        },

        getSelectedFiles: () => {
            const selectedFiles = new Map();

            // 方法1: 从全局状态获取（解决虚拟滚动问题）
            const stateFiles = App.getSelectedFilesFromState();
            if (stateFiles.length > 0) {
                Utils.log('从状态获取到文件:', stateFiles.length);
                stateFiles.forEach(f => {
                    if (f.fid && !selectedFiles.has(f.fid)) {
                        selectedFiles.set(f.fid, f);
                    }
                });
            }

            // 方法2: 从 Fiber 树深度遍历获取
            if (selectedFiles.size === 0) {
                const fiberFiles = App.getSelectedFilesFromFiberTree();
                if (fiberFiles.length > 0) {
                    Utils.log('从Fiber树获取到文件:', fiberFiles.length);
                    fiberFiles.forEach(f => {
                        if (f.fid && !selectedFiles.has(f.fid)) {
                            selectedFiles.set(f.fid, f);
                        }
                    });
                }
            }

            // 方法3: 从DOM获取（可见的文件）
            // 选择器列表 - 覆盖各种可能的选中状态
            const checkboxSelectors = [
                // Ant Design 复选框
                '.ant-checkbox-wrapper-checked',
                '.ant-checkbox-checked',
                '[class*="checkbox"][class*="checked"]',
                // 选中状态的行
                '.file-item-selected',
                '[class*="selected"]',
                '[class*="active"]',
                // aria 属性
                '[aria-checked="true"]',
                '[aria-selected="true"]',
                // 夸克特定选择器
                '.file-list-item.selected',
                '.list-item.selected',
                '[class*="fileItem"][class*="selected"]',
                '[class*="file-item"][class*="selected"]',
                // 复选框输入
                'input[type="checkbox"]:checked'
            ];

            // 行容器选择器
            const rowSelectors = [
                '.ant-table-row',
                '.file-list-item',
                '.file-item',
                '.list-item',
                '[class*="fileItem"]',
                '[class*="file-item"]',
                '[class*="ListItem"]',
                '[class*="tableRow"]',
                'tr[data-row-key]',
                '[data-fid]',
                '[data-id]'
            ];

            Utils.log('开始查找选中的文件...');

            // 方法1: 通过选中的复选框查找
            for (const selector of checkboxSelectors) {
                try {
                    const elements = document.querySelectorAll(selector);
                    Utils.log(`选择器 "${selector}" 找到 ${elements.length} 个元素`);

                    elements.forEach(el => {
                        // 跳过表头
                        if (el.closest('.ant-table-thead') ||
                            el.closest('.list-head') ||
                            el.closest('[class*="header"]') ||
                            el.closest('[class*="Header"]')) {
                            return;
                        }

                        // 找到所属的行
                        let row = el;
                        for (const rowSelector of rowSelectors) {
                            const found = el.closest(rowSelector);
                            if (found) {
                                row = found;
                                break;
                            }
                        }

                        // 尝试获取文件数据
                        const fileData = Utils.getFileFromRow(row) || Utils.getFidFromFiber(el);
                        if (fileData && fileData.fid && !selectedFiles.has(fileData.fid)) {
                            Utils.log('找到选中文件:', fileData.name);
                            selectedFiles.set(fileData.fid, fileData);
                        }
                    });
                } catch (e) {
                    Utils.log('选择器错误:', selector, e);
                }
            }

            // 方法2: 直接查找带有选中样式的行
            if (selectedFiles.size === 0) {
                Utils.log('方法1未找到文件，尝试方法2...');
                for (const rowSelector of rowSelectors) {
                    try {
                        const rows = document.querySelectorAll(rowSelector);
                        rows.forEach(row => {
                            // 检查行是否有选中样式
                            const isSelected = row.classList.contains('selected') ||
                                row.classList.contains('checked') ||
                                row.classList.contains('active') ||
                                row.querySelector('.ant-checkbox-checked') ||
                                row.querySelector('[aria-checked="true"]') ||
                                row.querySelector('input:checked');

                            if (isSelected) {
                                const fileData = Utils.getFileFromRow(row);
                                if (fileData && fileData.fid && !selectedFiles.has(fileData.fid)) {
                                    selectedFiles.set(fileData.fid, fileData);
                                }
                            }
                        });
                    } catch (e) {
                        Utils.log('行选择器错误:', rowSelector, e);
                    }
                }
            }

            // 方法3: 扫描所有可能的文件元素，检查视觉选中状态
            if (selectedFiles.size === 0) {
                Utils.log('方法2未找到文件，尝试方法3...');
                const allRows = document.querySelectorAll('[class*="file"], [class*="File"], [class*="item"], [class*="Item"], [class*="row"], [class*="Row"]');
                allRows.forEach(row => {
                    // 检查复选框
                    const checkbox = row.querySelector('input[type="checkbox"], .ant-checkbox, [class*="checkbox"], [class*="Checkbox"]');
                    if (checkbox) {
                        const isChecked = checkbox.checked ||
                            checkbox.classList.contains('ant-checkbox-checked') ||
                            checkbox.closest('.ant-checkbox-wrapper-checked') ||
                            checkbox.getAttribute('aria-checked') === 'true';

                        if (isChecked) {
                            const fileData = Utils.getFileFromRow(row);
                            if (fileData && fileData.fid && !selectedFiles.has(fileData.fid)) {
                                selectedFiles.set(fileData.fid, fileData);
                            }
                        }
                    }
                });
            }

            Utils.log(`共找到 ${selectedFiles.size} 个选中的文件`);
            return Array.from(selectedFiles.values());
        },

        loadShareTargetFolderOptions: async () => {
            try {
                const rootItems = await Utils.listAllFiles('0');
                const defaultShareTargetFolderId = await Utils.ensureShareTargetFolder('', rootItems);
                State.shareTargetFolderId = defaultShareTargetFolderId;
                State.shareTargetFolderOptions = await Utils.getShareTargetFolderOptions(defaultShareTargetFolderId, rootItems);

                const select = document.getElementById('quark-share-target-select');
                if (select) {
                    select.innerHTML = State.shareTargetFolderOptions
                        .map(option => `<option value="${option.id}" ${option.id === State.shareTargetFolderId ? 'selected' : ''}>${option.name}</option>`)
                        .join('');
                    select.value = State.shareTargetFolderId;
                }
            } catch (error) {
                console.warn('[夸克网盘下载助手] 加载保存目录失败:', error);
            }
        },

        run: async (filterType = 'all') => {
            const btn = document.getElementById('quark-btn');
            const L = State.getLang();

            try {
                const isShare = Utils.isSharePage();
                if (isShare) {
                    if (btn) {
                        btn.innerHTML = `<span class="quark-spinner"></span> ${L.processing}`;
                        btn.disabled = true;
                    }

                    State.setShareDownloadMode('keep');
                    State.resetShareContext();
                    const { pwdId, stoken, passcode } = Utils.getShareParams();
                    if (!pwdId) {
                        Utils.toast(L.networkError, 'error');
                        return;
                    }

                    const pageShareResult = Utils.getShareFilesFromPage();
                    const shareItems = pageShareResult.items || [];
                    if (!shareItems.length) {
                        Utils.toast(L.shareNoFiles, 'info');
                        return;
                    }

                    State.sharePwdId = pwdId;
                    State.shareToken = pageShareResult.token || stoken || '';
                    State.shareTreeData = shareItems;
                    State.shareTargetFolderId = '';
                    State.shareTargetFolderOptions = [{ id: '', name: `${CONFIG.SHARE_SAVE_ROOT_NAME}（加载中...）` }];
                    UI.showResultWindow(shareItems, { isShareMode: true });
                    App.loadShareTargetFolderOptions();
                    return;
                }

                let files = App.getSelectedFiles();
                console.log('[夸克网盘下载助手] 找到的原始文件:', files);
                console.log('[夸克网盘下载助手] 文件详情:', files.map(f => ({name: f.name, isDir: f.isDir, fid: f.fid})));

                const folders = files.filter(f => f.isDir);
                let regularFiles = files.filter(f => !f.isDir);
                console.log(`[夸克网盘下载助手] 文件: ${regularFiles.length}, 文件夹: ${folders.length}`);

                if (folders.length > 0) {
                    if (btn) {
                        btn.innerHTML = `<span class="quark-spinner"></span> ${L.expandingFolders}...`;
                        btn.disabled = true;
                    }

                    let folderWarning = null;
                    for (const folder of folders) {
                        Utils.toast(`${L.scanningFolder} ${folder.name}`, 'info');
                        const result = await Utils.getAllFilesInFolder(
                            folder.fid,
                            folder.name,
                            0,
                            (msg) => {
                                if (btn) btn.innerHTML = `<span class="quark-spinner"></span> ${msg}`;
                            }
                        );
                        regularFiles.push(...result.files);
                        if (result.warning) folderWarning = result.warning;
                        if (regularFiles.length >= CONFIG.FOLDER_MAX_FILES) {
                            folderWarning = 'count';
                            break;
                        }
                    }

                    if (folderWarning === 'depth') {
                        Utils.toast(L.folderTooDeep, 'info');
                    } else if (folderWarning === 'count') {
                        Utils.toast(L.folderTooMany, 'info');
                    }
                }

                files = regularFiles;
                if (filterType !== 'all') {
                    files = files.filter(f => Utils.getFileType(f.name || f.file_name) === filterType);
                }

                if (files.length === 0) {
                    const checkboxCount = document.querySelectorAll('.ant-checkbox-checked, .ant-checkbox-wrapper-checked, [aria-checked="true"]').length;
                    if (checkboxCount > 0) {
                        Utils.toast('检测到选中项，但无法获取文件信息。请尝试刷新页面后重试', 'error');
                    } else {
                        Utils.toast(L.noFiles, 'error');
                    }
                    return;
                }

                if (btn) {
                    btn.innerHTML = `<span class="quark-spinner"></span> ${L.processing}`;
                    btn.disabled = true;
                }

                const res = await Utils.post(CONFIG.API, { fids: files.map(f => f.fid) });
                if (res && res.code === 0 && res.data && res.data.length > 0) {
                    const fileInfoMap = new Map();
                    files.forEach(f => {
                        fileInfoMap.set(f.fid, {
                            folderPath: f.folderPath,
                            fullPath: f.fullPath
                        });
                    });

                    const enrichedData = res.data.map(item => ({
                        ...item,
                        folderPath: fileInfoMap.get(item.fid)?.folderPath || '',
                        fullPath: fileInfoMap.get(item.fid)?.fullPath || item.file_name
                    }));

                    State.addHistory(enrichedData);
                    UI.showResultWindow(enrichedData, { isShareMode: false });
                } else {
                    Utils.toast(`${L.parseError}: ${res?.message || '未获取到下载链接'}`, 'error');
                }
            } catch(e) {
                console.error('[夸克网盘下载助手]', e);
                Utils.toast(L.networkError, 'error');
            } finally {
                if (btn) {
                    btn.innerHTML = `${ICON('zap')} ${L.downloadHelper}`;
                    btn.disabled = false;
                }
            }
        },

        init: () => {
            UI.injectStyles();
            UI.createFloatButton();
            UI.applyTheme();
            App.bindShortcuts();
        },

        bindShortcuts: () => {
            document.addEventListener('keydown', (e) => {
                // Ctrl+D 快速下载
                if (e.ctrlKey && e.key === 'd') {
                    e.preventDefault();
                    App.run();
                }
                // Escape 关闭弹窗
                if (e.key === 'Escape') {
                    const modal = document.getElementById('quark-modal');
                    if (modal) modal.remove();
                }
            });
        }
    };

    // ==================== 界面 ====================
    const UI = {
        injectStyles: () => {
            GM_addStyle(`
                :root {
                    --wr-primary: #2563EB;
                    --wr-primary-hover: #1D4ED8;
                    --wr-primary-light: rgba(37, 99, 235, 0.12);
                    --wr-primary-glow: rgba(37, 99, 235, 0.25);
                    --wr-accent: #F97316;
                    --wr-success: #10B981;
                    --wr-success-hover: #059669;
                    --wr-danger: #EF4444;
                    --wr-danger-hover: #DC2626;
                    --wr-info: #3B82F6;
                    --wr-bg: #FFFFFF;
                    --wr-bg-elevated: #F8FAFC;
                    --wr-bg-inset: #F1F5F9;
                    --wr-surface: #FFFFFF;
                    --wr-text: #0F172A;
                    --wr-text-secondary: #64748B;
                    --wr-text-tertiary: #94A3B8;
                    --wr-border: #E2E8F0;
                    --wr-border-light: #F1F5F9;
                    --wr-shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
                    --wr-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
                    --wr-shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
                    --wr-shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);
                    --wr-shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
                    --wr-radius-sm: 6px;
                    --wr-radius: 8px;
                    --wr-radius-md: 10px;
                    --wr-radius-lg: 12px;
                    --wr-radius-xl: 16px;
                    --wr-radius-full: 9999px;
                    --wr-font: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
                    --wr-transition: 150ms cubic-bezier(0.4, 0, 0.2, 1);
                    --wr-transition-fast: 100ms cubic-bezier(0.4, 0, 0.2, 1);
                }

                @keyframes quark-toast-in {
                    from { opacity: 0; transform: translate(-50%, -12px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                @keyframes quark-toast-out {
                    from { opacity: 1; transform: translate(-50%, 0); }
                    to { opacity: 0; transform: translate(-50%, -12px); }
                }
                @keyframes quark-spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes quark-slide-in {
                    from { opacity: 0; transform: scale(0.96) translateY(8px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes quark-fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @media (prefers-reduced-motion: reduce) {
                    .quark-modal, .quark-toast, .quark-btn, .quark-menu,
                    .quark-action-btn, .quark-file-item {
                        animation: none !important;
                        transition: none !important;
                    }
                }

                .quark-svg-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    line-height: 1;
                }
                .quark-svg-icon svg {
                    display: block;
                }
                .quark-type-icon.video svg { stroke: #7C3AED; }
                .quark-type-icon.audio svg { stroke: #059669; }
                .quark-type-icon.image svg { stroke: #DB2777; }
                .quark-type-icon.document svg { stroke: #EA580C; }
                .quark-type-icon.archive svg { stroke: #0891B2; }
                .quark-type-icon.other svg { stroke: #64748B; }

                .quark-spinner {
                    display: inline-block;
                    width: 14px;
                    height: 14px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: quark-spin 0.8s linear infinite;
                    margin-right: 6px;
                    vertical-align: middle;
                }

                .quark-btn {
                    position: relative;
                    color: white;
                    font-size: 13px;
                    font-weight: 600;
                    padding: 8px 16px;
                    border: none;
                    border-radius: var(--wr-radius);
                    cursor: pointer;
                    background: #2563EB;
                    box-shadow: var(--wr-shadow);
                    transition: all var(--wr-transition);
                    font-family: var(--wr-font);
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    white-space: nowrap;
                }
                .quark-btn:hover {
                    background: #1D4ED8;
                    box-shadow: var(--wr-shadow-md), 0 0 16px rgba(37, 99, 235, 0.3);
                }
                .quark-btn:active {
                    transform: scale(0.97);
                }
                .quark-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .quark-btn:focus-visible {
                    outline: 2px solid #2563EB;
                    outline-offset: 2px;
                }

                div.btn-main { position: relative; }

                .quark-btn-wrapper {
                    position: relative;
                    display: inline-flex;
                }
                .quark-btn-wrapper:hover .quark-menu {
                    opacity: 1;
                    pointer-events: auto;
                }

                .quark-btn-float {
                    position: fixed;
                    top: 50%;
                    left: 16px;
                    transform: translateY(-50%);
                    z-index: 2147483647;
                    background: #2563EB;
                    padding: 12px 16px 12px 14px;
                    border-radius: var(--wr-radius-lg);
                    box-shadow: var(--wr-shadow-lg), 0 0 0 1px rgba(37, 99, 235, 0.1);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                }
                .quark-btn-float:hover {
                    padding-left: 18px;
                    box-shadow: var(--wr-shadow-xl), 0 0 20px rgba(37, 99, 235, 0.3);
                }
                .quark-btn-float:hover + .quark-menu,
                .quark-menu:hover {
                    opacity: 1;
                    pointer-events: auto;
                    left: 20px;
                }
                .quark-btn-float + .quark-menu {
                    position: fixed;
                    top: calc(50% + 48px);
                    left: 16px;
                    transform: translateY(-50%);
                }

                .quark-icon {
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                }

                .quark-menu {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    margin-top: 4px;
                    z-index: 2147483646;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    opacity: 0;
                    pointer-events: none;
                    transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
                }

                .quark-menu-item {
                    background: var(--wr-surface);
                    color: var(--wr-text);
                    padding: 8px 14px;
                    border-radius: var(--wr-radius);
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    box-shadow: var(--wr-shadow-md);
                    transition: all var(--wr-transition);
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    border: 1px solid var(--wr-border);
                    font-family: var(--wr-font);
                }
                .quark-menu-item:hover {
                    background: #2563EB;
                    color: white;
                    border-color: transparent;
                }
                .quark-menu-item:focus-visible {
                    outline: 2px solid var(--wr-primary);
                    outline-offset: 2px;
                }

                .quark-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(15, 23, 42, 0.5);
                    z-index: 2147483648;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    animation: quark-fade-in 200ms ease-out;
                }

                .quark-modal {
                    background: var(--wr-bg);
                    width: 740px;
                    max-width: 92%;
                    max-height: 85vh;
                    border-radius: var(--wr-radius-xl);
                    box-shadow: var(--wr-shadow-xl), 0 0 0 1px rgba(0,0,0,0.05);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: quark-slide-in 250ms cubic-bezier(0.16, 1, 0.3, 1);
                    font-family: var(--wr-font);
                }

                .quark-tab-content {
                    display: none;
                    flex-direction: column;
                    min-height: 0;
                    flex: 1;
                    overflow: hidden;
                }
                .quark-tab-content.active {
                    display: flex;
                }

                .quark-modal-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--wr-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: var(--wr-bg-elevated);
                }

                .quark-modal-title {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 700;
                    color: var(--wr-text);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    letter-spacing: -0.01em;
                }

                .quark-modal-close {
                    cursor: pointer;
                    font-size: 0;
                    line-height: 1;
                    opacity: 0.6;
                    transition: all var(--wr-transition);
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: var(--wr-radius);
                    background: transparent;
                    border: none;
                    color: var(--wr-text-secondary);
                }
                .quark-modal-close:hover {
                    opacity: 1;
                    background: var(--wr-bg-inset);
                    color: var(--wr-text);
                }
                .quark-modal-close:focus-visible {
                    outline: 2px solid var(--wr-primary);
                    outline-offset: 2px;
                }

                .quark-toolbar {
                    padding: 12px 24px;
                    background: var(--wr-bg-elevated);
                    border-bottom: 1px solid var(--wr-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .quark-toolbar-info {
                    font-size: 13px;
                    color: var(--wr-text-secondary);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .quark-toolbar-actions {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .quark-share-mode {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                    flex-wrap: wrap;
                }

                .quark-share-mode-label {
                    font-size: 13px;
                    color: var(--wr-text-secondary);
                    font-weight: 600;
                }

                .quark-share-mode-btn {
                    padding: 5px 14px;
                    border-radius: var(--wr-radius-full);
                    border: 1px solid var(--wr-border);
                    background: transparent;
                    color: var(--wr-text-secondary);
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all var(--wr-transition);
                    font-family: var(--wr-font);
                }
                .quark-share-mode-btn:hover {
                    border-color: var(--wr-primary);
                    color: var(--wr-primary);
                }
                .quark-share-mode-btn.active {
                    background: var(--wr-primary);
                    color: white;
                    border-color: transparent;
                }
                .quark-share-mode-btn:focus-visible {
                    outline: 2px solid var(--wr-primary);
                    outline-offset: 2px;
                }

                .quark-btn-group {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                }

                .quark-action-btn {
                    padding: 7px 14px;
                    border: none;
                    border-radius: var(--wr-radius);
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                    transition: all var(--wr-transition);
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    font-family: var(--wr-font);
                    letter-spacing: -0.01em;
                }
                .quark-action-btn:focus-visible {
                    outline: 2px solid var(--wr-primary);
                    outline-offset: 2px;
                }

                .quark-action-btn.primary {
                    background: #2563EB;
                    color: white;
                }
                .quark-action-btn.primary:hover {
                    background: #1D4ED8;
                    box-shadow: var(--wr-shadow-md), 0 0 16px rgba(37, 99, 235, 0.3);
                }

                .quark-action-btn.secondary {
                    background: #334155;
                    color: white;
                }
                .quark-action-btn.secondary:hover {
                    background: #1E293B;
                    box-shadow: var(--wr-shadow-md);
                }

                .quark-action-btn.success {
                    background: #7C3AED;
                    color: white;
                }
                .quark-action-btn.success:hover {
                    background: #6D28D9;
                    box-shadow: var(--wr-shadow-md), 0 0 12px rgba(124, 58, 237, 0.25);
                }

                .quark-action-btn.accent {
                    background: #0891B2;
                    color: white;
                }
                .quark-action-btn.accent:hover {
                    background: #0E7490;
                    box-shadow: var(--wr-shadow-md), 0 0 12px rgba(8, 145, 178, 0.25);
                }

                .quark-action-btn.warning {
                    background: #EF4444;
                    color: white;
                }
                .quark-action-btn.warning:hover {
                    background: #DC2626;
                    box-shadow: var(--wr-shadow-md);
                }

                .quark-modal-body {
                    padding: 16px 24px;
                    overflow-y: auto;
                    flex: 1;
                    min-height: 0;
                    max-height: 400px;
                    background: var(--wr-bg);
                }

                .quark-file-item {
                    background: var(--wr-bg-elevated);
                    padding: 8px 14px;
                    margin-bottom: 4px;
                    border-radius: var(--wr-radius);
                    border-left: 3px solid var(--wr-primary);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all var(--wr-transition);
                }
                .quark-file-item:hover {
                    background: var(--wr-primary-light);
                    box-shadow: var(--wr-shadow-sm);
                }

                .quark-file-item.share-tree-item {
                    position: relative;
                    border-left: none;
                    padding-left: calc(14px + var(--share-depth, 0) * 18px);
                    width: calc(100% - var(--share-depth, 0) * 18px);
                    box-sizing: border-box;
                    background: var(--wr-bg-elevated);
                }

                .quark-file-item.share-tree-item[data-depth]:not([data-depth="0"])::before {
                    content: '';
                    position: absolute;
                    left: calc(var(--share-depth) * 16px + 38px);
                    top: -8px;
                    bottom: -8px;
                    border-left: 1px solid var(--wr-border);
                    pointer-events: none;
                }
                .quark-file-item.share-tree-item[data-depth]:not([data-depth="0"])[data-is-last-sibling="1"]::before {
                    bottom: 50%;
                }

                .quark-file-item.share-tree-hidden {
                    display: none !important;
                }

                .quark-file-info {
                    overflow: hidden;
                    flex: 1;
                    margin-right: 8px;
                }
                .quark-file-actions {
                    display: flex;
                    gap: 4px;
                    align-items: center;
                    flex-shrink: 0;
                }

                .quark-share-check {
                    margin-right: 4px;
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                    accent-color: var(--wr-primary);
                    flex-shrink: 0;
                }

                .quark-file-name {
                    position: relative;
                    font-weight: 600;
                    color: var(--wr-text);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                }

                .quark-file-size-inline {
                    color: var(--wr-text-tertiary);
                    font-size: 12px;
                    font-weight: 500;
                    flex-shrink: 0;
                }

                .quark-share-node-icon {
                    width: 18px;
                    min-width: 18px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }

                .quark-share-tree-branch {
                    --share-depth: 0;
                    position: relative;
                    width: calc(var(--share-depth) * 16px + 16px);
                    min-width: calc(var(--share-depth) * 16px + 16px);
                    height: 20px;
                    padding-left: calc(var(--share-depth) * 16px);
                    box-sizing: border-box;
                    flex-shrink: 0;
                    display: inline-block;
                    background-image: var(--share-tree-guides, none);
                    background-position: 0 0;
                    background-repeat: no-repeat;
                }

                .quark-file-item.share-tree-item[data-depth]:not([data-depth="0"]) .quark-file-name::before {
                    content: '';
                    position: absolute;
                    left: calc(var(--share-depth) * 16px + 38px);
                    top: 50%;
                    width: 12px;
                    height: 1px;
                    background: var(--wr-border);
                    transform: translateY(-50%);
                    pointer-events: none;
                }

                .quark-share-tree-branch::before {
                    content: '';
                    position: absolute;
                    left: calc(var(--share-depth) * 16px);
                    top: 50%;
                    width: 10px;
                    height: 1px;
                    background: var(--wr-border);
                }
                .quark-share-tree-branch::after {
                    content: '';
                    position: absolute;
                    left: calc(var(--share-depth) * 16px + 10px);
                    top: 50%;
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background: var(--wr-primary);
                    transform: translateY(-50%);
                    opacity: 0.5;
                }

                .quark-share-tree-toggle {
                    width: 24px;
                    height: 24px;
                    border: none;
                    background: transparent;
                    color: var(--wr-text-secondary);
                    padding: 0;
                    margin-right: 2px;
                    cursor: pointer;
                    flex-shrink: 0;
                    font-size: 0;
                    line-height: 24px;
                    text-align: center;
                    border-radius: var(--wr-radius-sm);
                    transition: all var(--wr-transition);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .quark-share-tree-toggle:hover {
                    background: var(--wr-primary-light);
                    color: var(--wr-primary);
                }
                .quark-share-tree-toggle:focus-visible {
                    outline: 2px solid var(--wr-primary);
                    outline-offset: 2px;
                }

                .quark-share-tree-toggle-spacer {
                    width: 4px;
                    min-width: 4px;
                    height: 24px;
                    display: inline-block;
                    flex-shrink: 0;
                }

                .quark-file-meta {
                    font-size: 12px;
                    color: var(--wr-text-tertiary);
                    margin-top: 4px;
                }

                .quark-file-btn {
                    padding: 5px 10px;
                    border: none;
                    border-radius: var(--wr-radius-sm);
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 600;
                    transition: all var(--wr-transition);
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                    font-family: var(--wr-font);
                }
                .quark-file-btn:focus-visible {
                    outline: 2px solid var(--wr-primary);
                    outline-offset: 2px;
                }

                .quark-file-btn.idm {
                    background: var(--wr-success);
                    color: white;
                }
                .quark-file-btn.curl {
                    background: var(--wr-text);
                    color: white;
                }
                .quark-file-btn.aria2 {
                    background: #7C3AED;
                    color: white;
                }
                .quark-file-btn.motrix {
                    background: #0891B2;
                    color: white;
                }
                .quark-file-btn:hover {
                    filter: brightness(1.1);
                    box-shadow: var(--wr-shadow-sm);
                }

                .quark-tabs {
                    display: flex;
                    gap: 0;
                    border-bottom: 1px solid var(--wr-border);
                    padding: 0 24px;
                    background: var(--wr-bg);
                }

                .quark-tab {
                    padding: 10px 16px;
                    cursor: pointer;
                    border: none;
                    background: none;
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--wr-text-tertiary);
                    position: relative;
                    transition: all var(--wr-transition);
                    font-family: var(--wr-font);
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .quark-tab:hover {
                    color: var(--wr-primary);
                }
                .quark-tab.active {
                    color: var(--wr-primary);
                    font-weight: 600;
                }
                .quark-tab.active::after {
                    content: '';
                    position: absolute;
                    bottom: -1px;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: var(--wr-primary);
                    border-radius: 2px 2px 0 0;
                }
                .quark-tab:focus-visible {
                    outline: 2px solid var(--wr-primary);
                    outline-offset: -2px;
                    border-radius: var(--wr-radius-sm);
                }

                .quark-empty {
                    text-align: center;
                    padding: 48px 20px;
                    color: var(--wr-text-tertiary);
                }
                .quark-empty-icon {
                    font-size: 0;
                    margin-bottom: 16px;
                    color: var(--wr-text-tertiary);
                }
                .quark-empty-icon svg {
                    stroke: var(--wr-text-tertiary);
                }

                .quark-settings-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 14px 0;
                    border-bottom: 1px solid var(--wr-border-light);
                }
                .quark-settings-item:last-child {
                    border-bottom: none;
                }

                .quark-settings-label {
                    font-size: 14px;
                    color: var(--wr-text);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .quark-select {
                    padding: 6px 28px 6px 12px;
                    border: 1px solid var(--wr-border);
                    border-radius: var(--wr-radius);
                    background: var(--wr-bg);
                    color: var(--wr-text);
                    font-size: 13px;
                    cursor: pointer;
                    font-family: var(--wr-font);
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 8px center;
                }
                .quark-select:focus-visible {
                    outline: 2px solid var(--wr-primary);
                    outline-offset: 2px;
                }

                .quark-dark {
                    --wr-primary: #3B82F6;
                    --wr-primary-hover: #2563EB;
                    --wr-primary-light: rgba(59, 130, 246, 0.15);
                    --wr-primary-glow: rgba(59, 130, 246, 0.3);
                    --wr-bg: #0F172A;
                    --wr-bg-elevated: #1E293B;
                    --wr-bg-inset: #1E293B;
                    --wr-surface: #1E293B;
                    --wr-text: #F1F5F9;
                    --wr-text-secondary: #94A3B8;
                    --wr-text-tertiary: #64748B;
                    --wr-border: #334155;
                    --wr-border-light: #1E293B;
                    --wr-shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
                    --wr-shadow: 0 1px 3px rgba(0,0,0,0.4);
                    --wr-shadow-md: 0 4px 6px rgba(0,0,0,0.4);
                    --wr-shadow-lg: 0 10px 15px rgba(0,0,0,0.4);
                    --wr-shadow-xl: 0 20px 25px rgba(0,0,0,0.5);
                }
                .quark-dark .quark-modal {
                    box-shadow: var(--wr-shadow-xl), 0 0 0 1px rgba(255,255,255,0.06);
                }
                .quark-dark .quark-type-icon.video svg { stroke: #A78BFA; }
                .quark-dark .quark-type-icon.audio svg { stroke: #34D399; }
                .quark-dark .quark-type-icon.image svg { stroke: #F472B6; }
                .quark-dark .quark-type-icon.document svg { stroke: #FB923C; }
                .quark-dark .quark-type-icon.archive svg { stroke: #22D3EE; }
                .quark-dark .quark-type-icon.other svg { stroke: #94A3B8; }

                .quark-footer {
                    padding: 10px 24px;
                    border-top: 1px solid var(--wr-border-light);
                    background: var(--wr-bg-elevated);
                    text-align: center;
                    font-size: 11px;
                    color: var(--wr-text-tertiary);
                }
                .quark-footer a {
                    color: var(--wr-primary);
                    text-decoration: none;
                    font-weight: 500;
                }
                .quark-footer a:hover {
                    text-decoration: underline;
                }
            `);
        },

        applyTheme: () => {
            const modal = document.getElementById('quark-modal');
            if (modal) {
                if (State.isDark()) {
                    modal.classList.add('quark-dark');
                } else {
                    modal.classList.remove('quark-dark');
                }
            }
        },

        createFloatButton: () => {
            if (document.getElementById('quark-btn')) return;

            const L = State.getLang();
            const isSharePage = Utils.isSharePage();

            const btn = document.createElement('button');
            btn.id = 'quark-btn';
            btn.className = 'quark-btn';
            btn.innerHTML = `${ICON('zap')} ${L.downloadHelper}`;
            btn.onclick = () => App.run();

            const menu = document.createElement('div');
            menu.className = 'quark-menu';
            menu.innerHTML = `
                <div class="quark-menu-item" data-action="settings">${ICON('settings')} ${L.settings}</div>
                <div class="quark-menu-item" data-action="debug">${ICON('wrench')} 调试模式</div>
            `;

            const btnMain = document.querySelector('div.btn-main');

            if (!isSharePage && btnMain) {
                const wrapper = document.createElement('div');
                wrapper.className = 'quark-btn-wrapper';
                wrapper.appendChild(btn);
                wrapper.appendChild(menu);
                btnMain.appendChild(wrapper);
            } else {
                btn.classList.add('quark-btn-float');
                document.body.appendChild(btn);
                document.body.appendChild(menu);
            }

            menu.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                if (action === 'settings') {
                    UI.showSettingsWindow();
                } else if (action === 'debug') {
                    CONFIG.DEBUG = !CONFIG.DEBUG;
                    Utils.toast(`调试模式已${CONFIG.DEBUG ? '开启' : '关闭'}，查看控制台获取详细信息`, 'info');
                    if (CONFIG.DEBUG) {
                        // 输出详细的页面分析
                        console.log('==========================================');
                        console.log('[夸克网盘下载助手] 调试信息 v' + CONFIG.VERSION);
                        console.log('==========================================');
                        console.log('页面类型:', Utils.isSharePage() ? '分享页面' : '个人网盘');
                        console.log('URL:', location.href);

                        // 复选框分析
                        const checkboxes = document.querySelectorAll('.ant-checkbox, [class*="checkbox"]');
                        const checkedBoxes = document.querySelectorAll('.ant-checkbox-checked, .ant-checkbox-wrapper-checked, [aria-checked="true"]');
                        console.log('复选框总数:', checkboxes.length);
                        console.log('选中的复选框:', checkedBoxes.length);

                        // 文件行分析
                        const rows = document.querySelectorAll('.ant-table-row, [class*="file-item"], [class*="fileItem"], [class*="list-item"]');
                        console.log('文件行元素:', rows.length);

                        // 尝试分析全局状态
                        const win = unsafeWindow || window;
                        console.log('全局变量检测:');
                        ['__REDUX_STORE__', 'store', '__store__', '__INITIAL_STATE__', '__DATA__'].forEach(v => {
                            if (win[v]) console.log(`  - ${v}: 存在`);
                        });

                        // 尝试获取文件
                        console.log('尝试获取选中文件...');
                        const files = App.getSelectedFiles();
                        console.log('获取到的文件:', files.length);
                        files.forEach((f, i) => {
                            console.log(`  ${i+1}. ${f.name} (fid: ${f.fid}, isDir: ${f.isDir})`);
                        });

                        console.log('==========================================');
                    }
                }
            });
        },

        showResultWindow: (data, options = {}) => {
            const L = State.getLang();
            const isShareMode = options.isShareMode === true;
            UI.removeModal();

            const hasFolderStructure = data.some(f => f.folderPath || (f.fullPath && f.fullPath.includes('/')));
            const isTreeMode = isShareMode || hasFolderStructure;

            const displayData = isTreeMode ? Utils.orderShareItemsByPath(data) : data;
            const treeRenderData = isTreeMode ? Utils.buildShareTreeRenderMeta(displayData) : displayData;
            const totalSize = displayData.reduce((sum, f) => sum + (f.size || 0), 0);
            const modal = document.createElement('div');
            modal.id = 'quark-modal';
            modal.className = `quark-modal-overlay ${State.isDark() ? 'quark-dark' : ''}`;

            const directFiles = displayData.filter(f => f.download_url);
            const aria2Commands = Utils.generateAria2Commands(directFiles);
            const curlCommands = Utils.generateCurlCommands(directFiles);
            const shareModeHTML = isShareMode ? `
                <div class="quark-share-mode">
                    <span class="quark-share-mode-label">${L.shareMode}</span>
                    <button class="quark-share-mode-btn ${State.shareDownloadMode === 'keep' ? 'active' : ''}" data-share-mode="keep">${L.shareKeepDownload}</button>
                    <button class="quark-share-mode-btn ${State.shareDownloadMode === 'clean' ? 'active' : ''}" data-share-mode="clean">${L.shareCleanDownload}</button>
                </div>` : '';
            const shareTargetFolderHTML = isShareMode ? `
                <div class="quark-settings-item" style="padding:0;border:none;margin-bottom:12px;">
                    <span class="quark-settings-label">${L.shareTargetFolder}</span>
                    <select class="quark-select" id="quark-share-target-select">
                        ${State.shareTargetFolderOptions.map(option => `<option value="${option.id}" ${option.id === State.shareTargetFolderId ? 'selected' : ''}>${option.name}</option>`).join('')}
                    </select>
                </div>` : '';

            const renderShareFileList = (shareItems) => {
                const renderData = isTreeMode ? Utils.buildShareTreeRenderMeta(Utils.orderShareItemsByPath(shareItems)) : shareItems;
                return renderData.map((f, index) => {
                    const isDirectory = Boolean(isTreeMode && (f.isDir || f.file_type === 0));
                    const icon = isDirectory ? ICON('folderOpen', 'quark-type-icon other') : Utils.getFileIcon(f.file_name);
                    const isChecked = isTreeMode && (isShareMode ? State.shareSelectedIds.includes(String(f.fid || '')) : true);
                    const pathDepth = isTreeMode ? Math.max(0, (String(f.fullPath || f.file_name || '').split('/').length - 1)) : 0;
                    const treeParentPath = isTreeMode ? (f.__shareParentPath || '') : '';
                    const treeIsLastSibling = isTreeMode ? (f.__shareIsLastSibling ? '1' : '0') : '0';
                    const treeGuideStyle = isTreeMode ? (f.__shareGuideStyle || 'none') : 'none';
                    const treeToggleHTML = isTreeMode
                        ? (isDirectory
                            ? `<button class="quark-share-tree-toggle expanded" data-path="${f.fullPath || f.file_name}" data-collapsed="false">${ICON('chevronDown')}</button>`
                            : `<span class="quark-share-tree-toggle-spacer"></span>`)
                        : '';
                    const checkboxHTML = isTreeMode
                        ? `<input type="checkbox" class="quark-share-check" data-fid="${f.fid}" data-pdir="${f.pdir_fid || ''}" data-path="${f.fullPath || f.file_name}" ${isChecked ? 'checked' : ''}>`
                        : '';

                    return `
                    <div class="quark-file-item ${isTreeMode ? 'share-tree-item' : ''}" data-type="${Utils.getFileType(f.file_name)}" data-fid="${f.fid || ''}" data-pdir="${f.pdir_fid || ''}" data-path="${f.fullPath || f.file_name}" data-parent-path="${treeParentPath}" data-is-last-sibling="${treeIsLastSibling}" data-depth="${pathDepth}" data-dir="${isDirectory ? '1' : '0'}" style="${isTreeMode ? `--share-depth:${pathDepth};` : ''}">
                        ${checkboxHTML}
                        <div class="quark-file-info">
                            <div class="quark-file-name" title="${f.fullPath || f.file_name}">
                                ${treeToggleHTML}
                                <span class="quark-share-tree-branch" style="${isTreeMode ? `--share-depth:${pathDepth};--share-tree-guides:${treeGuideStyle}` : ''}"></span>
                                <span class="quark-share-node-icon">${icon}</span>
                                <span>${f.file_name}</span>
                                <span class="quark-file-size-inline">(${Utils.formatSize(f.size || 0)})</span>
                            </div>
                        </div>
                    </div>`;
                }).join('');
            };

            const fileListHTML = renderShareFileList(displayData);

            modal.innerHTML = `
            <div class="quark-modal">
                <div class="quark-modal-header">
                    <h3 class="quark-modal-title">
                        ${ICON('checkCircle', 'quark-type-icon video')}
                        <span>${isShareMode ? L.downloadHelper : L.success} (${data.length} ${L.files})</span>
                    </h3>
                    <button class="quark-modal-close" aria-label="${L.close}">${ICON('x')}</button>
                </div>

                <div class="quark-tabs">
                    <button class="quark-tab active" data-tab="files">${ICON('folder')} ${L.files}</button>
                    <button class="quark-tab" data-tab="settings">${ICON('settings')} ${L.settings}</button>
                </div>

                <div class="quark-tab-content active" data-content="files">
                    <div class="quark-toolbar">
                        <div class="quark-toolbar-info">
                            <span>${L.totalSize}: <strong>${Utils.formatSize(totalSize)}</strong></span>
                            <span style="margin-left:15px;font-size:12px;color:var(--wr-text-tertiary);">${isShareMode ? L.shareSelectTip : (isTreeMode ? L.shareSelectTip : L.idmTip)}</span>
                        </div>
                        <div class="quark-toolbar-actions">
                            ${isTreeMode ? `<button class="quark-action-btn secondary" id="quark-select-all">${ICON('checkCircle')} ${L.selectAll}</button>` : ''}
                        </div>
                    </div>
                    <div class="quark-toolbar" style="border-top:none;padding-top:0;display:block;">
                        ${shareModeHTML}
                        ${shareTargetFolderHTML}
                        <div class="quark-btn-group">
                            <button class="quark-action-btn primary" id="quark-send-idm">${ICON('download')} ${L.sendToIdm}</button>
                            <button class="quark-action-btn success" id="quark-send-aria2">${ICON('rocket')} ${L.sendToAria2}</button>
                            <button class="quark-action-btn secondary" id="quark-send-curl">${ICON('terminal')} ${L.sendToCurl}</button>
                            <button class="quark-action-btn accent" id="quark-send-motrix">${ICON('loader')} ${L.sendToMotrix}</button>
                        </div>
                        <div class="quark-idm-ua-box" style="margin-top:10px;padding:8px 12px;background:var(--wr-bg-secondary, #f5f5f5);border-radius:6px;display:flex;align-items:center;gap:8px;">
                            <span style="font-size:12px;color:var(--wr-text-secondary, #666);white-space:nowrap;">${L.idmTip}:</span>
                            <code style="font-size:11px;color:var(--wr-text-primary, #333);word-break:break-all;flex:1;">quark-cloud-drive/2.5.20</code>
                            <button class="quark-action-btn secondary" id="quark-copy-ua" style="padding:2px 8px;font-size:11px;min-width:auto;white-space:nowrap;">${L.copyUa}</button>
                        </div>
                    </div>
                    <div class="quark-modal-body" id="quark-file-list">
                        ${fileListHTML}
                    </div>
                </div>

                <div class="quark-tab-content" data-content="settings">
                    <div class="quark-modal-body">
                        <div class="quark-settings-item" style="display:block;">
                            <div class="quark-settings-label" style="margin-bottom:10px;">${ICON('loader')} ${L.motrixSettings}</div>
                            <label style="display:block;color:var(--wr-text-secondary);font-size:12px;margin-bottom:6px;">${L.motrixRpcUrl}</label>
                            <input class="quark-input" id="quark-motrix-rpc-url" value="${Utils.escapeHtml(State.motrixRpcUrl)}" placeholder="http://127.0.0.1:16800/jsonrpc" style="width:100%;margin-bottom:10px;">
                            <label style="display:block;color:var(--wr-text-secondary);font-size:12px;margin-bottom:6px;">${L.motrixRpcToken} <span style="opacity:.7;">(${L.motrixRpcTokenTip})</span></label>
                            <input class="quark-input" id="quark-motrix-rpc-token" value="${Utils.escapeHtml(State.motrixRpcToken)}" placeholder="" style="width:100%;">
                        </div>
                        <div class="quark-settings-item">
                            <span class="quark-settings-label">${ICON('moon')} ${L.darkMode}</span>
                            <select class="quark-select" id="quark-theme-select">
                                <option value="auto" ${State.theme === 'auto' ? 'selected' : ''}>${L.auto}</option>
                                <option value="light" ${State.theme === 'light' ? 'selected' : ''}>${L.light}</option>
                                <option value="dark" ${State.theme === 'dark' ? 'selected' : ''}>${L.dark}</option>
                            </select>
                        </div>
                        <div class="quark-settings-item">
                            <span class="quark-settings-label">${ICON('globe')} ${L.language}</span>
                            <select class="quark-select" id="quark-lang-select">
                                <option value="zh" ${State.lang === 'zh' ? 'selected' : ''}>中文</option>
                                <option value="en" ${State.lang === 'en' ? 'selected' : ''}>English</option>
                            </select>
                        </div>
                        <div class="quark-settings-item">
                            <span class="quark-settings-label">${ICON('keyboard')} 快捷键</span>
                            <span style="color:var(--wr-text-secondary);font-size:13px;">Ctrl+D 下载 / Esc 关闭</span>
                        </div>
                    </div>
                </div>

                <div class="quark-footer">
                    ${L.title} v${CONFIG.VERSION} ·
                    <a href="https://github.com/H1d3rOne/QuarkDownloader" target="_blank">GitHub</a>
                </div>
            </div>`;

            document.body.appendChild(modal);
            UI.bindModalEvents(modal, displayData, aria2Commands, curlCommands, { ...options, renderShareFileList, isTreeMode });
        },

        bindModalEvents: (modal, data, aria2Commands, curlCommands, options = {}) => {
            const L = State.getLang();
            const isShareMode = options.isShareMode === true;
            const isTreeMode = options.isTreeMode === true;
            const shareCollapseState = new Map();
            const logShareTreeDebug = (stage, payload = {}) => {
                if (!isTreeMode) return;
                console.log('[夸克网盘下载助手][share-tree]', stage, payload);
            };
            const ensureShareFolderChildrenLoaded = async (folderItem) => {
                if (!isShareMode || !folderItem) return false;

                const folderFid = folderItem.getAttribute('data-fid') || '';
                const folderPath = folderItem.getAttribute('data-path') || '';
                if (!folderFid || !folderPath || !State.sharePwdId || !State.shareToken) {
                    logShareTreeDebug('load-skip', {
                        folderFid,
                        folderPath,
                        reason: 'missing-context'
                    });
                    return false;
                }

                const currentShareItems = State.shareTreeData.length ? State.shareTreeData : data;
                const hasLoadedDescendants = currentShareItems.some(item => {
                    const itemPath = String(item?.fullPath || item?.file_name || '');
                    return itemPath.startsWith(`${folderPath}/`);
                });

                if (hasLoadedDescendants || State.shareLoadedFolderIds.has(folderFid)) {
                    logShareTreeDebug('load-skip', {
                        folderFid,
                        folderPath,
                        reason: hasLoadedDescendants ? 'descendants-already-present' : 'folder-already-loaded'
                    });
                    return false;
                }

                logShareTreeDebug('load-start', { folderFid, folderPath });
                Utils.toast(`${L.expandingFolders} ${folderPath}`, 'info');

                let loadedItems = [];
                try {
                    const loadResult = await Utils.getAllShareFiles(State.sharePwdId, State.shareToken, folderFid, folderPath, 0);
                    loadedItems = loadResult.items || [];
                } catch (error) {
                    const shouldRefreshToken = error?.status === 403 || /403/.test(String(error?.message || ''));
                    if (!shouldRefreshToken) {
                        logShareTreeDebug('load-failed', {
                            folderFid,
                            folderPath,
                            message: error?.message || String(error)
                        });
                        throw error;
                    }
                    State.shareToken = await Utils.getShareToken(State.sharePwdId, Utils.getShareParams().passcode || '');
                    const retryResult = await Utils.getAllShareFiles(State.sharePwdId, State.shareToken, folderFid, folderPath, 0);
                    loadedItems = retryResult.items || [];
                }

                State.shareLoadedFolderIds.add(folderFid);
                State.shareTreeData = Utils.mergeShareItems(currentShareItems, loadedItems);
                logShareTreeDebug('load-done', {
                    folderFid,
                    folderPath,
                    loadedCount: loadedItems.length
                });

                if (loadedItems.length > 0) {
                    rerenderShareFileList(State.shareTreeData);
                    return true;
                }

                return false;
            };

            modal.querySelector('.quark-modal-close')?.addEventListener('click', () => {
                UI.removeModal();
            });

            const getShareItemsFromSelection = (specificItem = null, { expandFolders = true } = {}) => {
                if (specificItem) return [specificItem];
                const checkedIds = Array.from(modal.querySelectorAll('.quark-share-check:checked')).map(input => input.getAttribute('data-fid')).filter(Boolean);
                console.log('[夸克网盘下载助手] 选中的文件ID数量:', checkedIds.length, checkedIds);
                if (checkedIds.length === 0 && isTreeMode) {
                    const fallbackItems = data.filter(f => f.download_url);
                    console.log('[夸克网盘下载助手] 无选中项，使用全部可下载文件:', fallbackItems.length);
                    return fallbackItems;
                }
                State.shareSelectedIds = checkedIds;
                const allItems = isShareMode ? (State.shareTreeData.length ? State.shareTreeData : data) : data;

                if (!expandFolders) {
                    const selectedSet = new Set(checkedIds);
                    const directSelection = allItems.filter(item => selectedSet.has(String(item.fid)));
                    console.log('[夸克网盘下载助手] 不展开文件夹，直接选择:', directSelection.length);
                    return directSelection;
                }

                const expanded = Utils.expandSelectedFolders(checkedIds, allItems);
                const expandedSet = new Set(expanded.map(f => String(f.fid)));
                console.log('[夸克网盘下载助手] 展开文件夹后的ID数量:', expandedSet.size);
                const finalSelection = allItems.filter(item => expandedSet.has(String(item.fid)));
                console.log('[夸克网盘下载助手] 最终选择的文件数量:', finalSelection.length);
                return finalSelection;
            };

            const updateShareTreeVisibility = () => {
                if (!isTreeMode) return;
                let hiddenCount = 0;
                modal.querySelectorAll('.quark-file-item[data-path]').forEach(item => {
                    const path = item.getAttribute('data-path') || '';
                    const segments = path.split('/').filter(Boolean);
                    let hidden = false;
                    let ancestorPath = '';
                    for (let index = 0; index < Math.max(0, segments.length - 1); index += 1) {
                        ancestorPath = ancestorPath ? `${ancestorPath}/${segments[index]}` : segments[index];
                        if (shareCollapseState.get(ancestorPath)) {
                            hidden = true;
                            break;
                        }
                    }
                    item.classList.toggle('share-tree-hidden', hidden);
                    if (hidden) {
                        hiddenCount += 1;
                    }
                });
                logShareTreeDebug('visibility', {
                    hiddenCount,
                    collapseState: Array.from(shareCollapseState.entries())
                });
            };

            const toggleShareTreeNode = (path, trigger = null) => {
                if (!path) {
                    logShareTreeDebug('toggle-skip', { reason: 'empty-path' });
                    return;
                }
                const button = trigger || modal.querySelector(`.quark-share-tree-toggle[data-path="${CSS.escape(path)}"]`);
                if (!button) {
                    logShareTreeDebug('toggle-skip', { path, reason: 'button-missing' });
                    return;
                }
                const beforeCollapsed = button.getAttribute('data-collapsed') === 'true';
                const nextCollapsed = !beforeCollapsed;
                button.setAttribute('data-collapsed', nextCollapsed ? 'true' : 'false');
                button.innerHTML = nextCollapsed ? ICON('chevronRight') : ICON('chevronDown');
                button.classList.toggle('collapsed', nextCollapsed);
                button.classList.toggle('expanded', !nextCollapsed);
                shareCollapseState.set(path, nextCollapsed);
                logShareTreeDebug('toggle', {
                    path,
                    beforeCollapsed,
                    nextCollapsed,
                    buttonFound: true
                });
                updateShareTreeVisibility();
            };

            const runIdmAction = (files) => {
                const validFiles = files.filter(f => f.download_url);
                if (validFiles.length === 0) return;
                validFiles.forEach((file, index) => {
                    setTimeout(() => {
                        const tab = GM_openInTab(file.download_url, { active: false, insert: true, setParent: true });
                        setTimeout(() => { try { tab.close(); } catch(e) {} }, 3000);
                    }, index * 2000);
                });
            };

            const runCurlAction = async (files) => {
                const content = Utils.generateCurlCommands(files);
                GM_setClipboard(content);
                Utils.toast(`cURL ${L.copied}`);
            };

            const runAria2Action = async (files) => {
                const content = Utils.generateAria2Commands(files);
                GM_setClipboard(content);
                Utils.toast(`aria2 ${L.copied}`);
            };

            const runMotrixAction = async (files) => {
                try {
                    const count = await Utils.sendFilesToMotrixRpc(files);
                    if (count > 0) {
                        Utils.toast(`${L.motrixBatchSent}`);
                    }
                } catch (error) {
                    const urls = Utils.generateMotrixUrls(files);
                    if (urls.length) {
                        GM_setClipboard(urls.join('\n'));
                    }
                    Utils.openMotrixProtocolPrompt();
                    Utils.toast('正在打开 Motrix，请稍候...', 'info');
                    try {
                        await Utils.waitForMotrixRpc();
                        const count = await Utils.sendFilesToMotrixRpc(files);
                        if (count > 0) {
                            Utils.toast(`${L.motrixBatchSent}`);
                            return;
                        }
                    } catch (retryError) {
                        throw new Error(`${retryError?.message || error?.message || 'Motrix RPC 未连接'}，请确认 Motrix 已打开并启用 RPC；任务链接已复制到剪贴板`);
                    }
                }
            };

            const ensureSelectedShareFoldersLoaded = async (selectedItems = []) => {
                if (!isShareMode || !State.sharePwdId || !State.shareToken) return;
                let currentShareItems = State.shareTreeData.length ? State.shareTreeData : data;
                const selectedFolders = selectedItems
                    .filter(item => item?.isDir || item?.file_type === 0)
                    .map(item => ({
                        fid: String(item?.fid || ''),
                        fullPath: String(item?.fullPath || item?.file_name || '')
                    }))
                    .filter(item => item.fid && item.fullPath)
                    .sort((a, b) => a.fullPath.split('/').length - b.fullPath.split('/').length);

                if (!selectedFolders.length) return;

                const rootFolders = [];
                for (const folder of selectedFolders) {
                    const coveredByParent = rootFolders.some(parent => folder.fullPath.startsWith(`${parent.fullPath}/`));
                    if (!coveredByParent) rootFolders.push(folder);
                }

                const foldersToLoad = rootFolders.filter(folder => {
                    if (State.shareLoadedFolderIds.has(folder.fid)) return false;
                    return !currentShareItems.some(item => {
                        const itemPath = String(item?.fullPath || item?.file_name || '');
                        return itemPath.startsWith(`${folder.fullPath}/`);
                    });
                });

                if (!foldersToLoad.length) return;

                Utils.toast(`${L.expandingFolders}...`, 'info');
                let loadedCount = 0;
                const loadedItemGroups = [];
                let nextIndex = 0;
                const workerCount = Math.min(4, foldersToLoad.length);

                const loadFolder = async (folder) => {
                    try {
                        const loadResult = await Utils.getAllShareFiles(State.sharePwdId, State.shareToken, folder.fid, folder.fullPath, 0);
                        return loadResult.items || [];
                    } catch (error) {
                        const shouldRefreshToken = error?.status === 403 || /403/.test(String(error?.message || ''));
                        if (!shouldRefreshToken) throw error;
                        State.shareToken = await Utils.getShareToken(State.sharePwdId, Utils.getShareParams().passcode || '');
                        const retryResult = await Utils.getAllShareFiles(State.sharePwdId, State.shareToken, folder.fid, folder.fullPath, 0);
                        return retryResult.items || [];
                    }
                };

                const workers = Array.from({ length: workerCount }, async () => {
                    while (nextIndex < foldersToLoad.length) {
                        const folder = foldersToLoad[nextIndex];
                        nextIndex += 1;
                        const loadedItems = await loadFolder(folder);
                        State.shareLoadedFolderIds.add(folder.fid);
                        loadedItemGroups.push(loadedItems);
                        loadedCount += loadedItems.length;
                    }
                });

                await Promise.all(workers);

                if (loadedCount > 0) {
                    loadedItemGroups.forEach(items => {
                        currentShareItems = Utils.mergeShareItems(currentShareItems, items);
                    });
                    State.shareTreeData = currentShareItems;
                    rerenderShareFileList(State.shareTreeData);
                    console.log('[夸克网盘下载助手] 下载前主动遍历文件数:', loadedCount);
                }
            };

            const handleShareAction = async (specificItem, action) => {
                try {
                    const selectedItems = getShareItemsFromSelection(specificItem, { expandFolders: false });
                    console.log('[夸克网盘下载助手] handleShareAction 选中的项目(含文件夹):', selectedItems.length, selectedItems.map(f => f.file_name));

                    const L = State.getLang();
                    if (!selectedItems.length) {
                        Utils.toast(L.shareSelectTip, 'error');
                        return;
                    }

                    await ensureSelectedShareFoldersLoaded(selectedItems);
                    const authoritativeItems = State.shareTreeData.length ? State.shareTreeData : data;
                    const hydratedSelectedItems = selectedItems.map(item => {
                        const latestItem = authoritativeItems.find(candidate => String(candidate?.fid || '') === String(item?.fid || ''));
                        return latestItem ? { ...latestItem, ...item, fullPath: latestItem.fullPath || item.fullPath || item.file_name } : item;
                    });
                    await Utils.executeShareDownloadAction(hydratedSelectedItems, action, {
                        authoritativeItems,
                        targetFolderId: State.shareTargetFolderId,
                        cleanMode: State.shareDownloadMode
                    });
                    console.log('[夸克网盘下载助手] 下载action执行完成');
                } catch (error) {
                    const L = State.getLang();
                    console.error('[夸克网盘下载助手] 分享下载失败:', error);
                    Utils.toast(error?.response?.message || error?.message || L.networkError, 'error');
                }
            };

            modal.querySelectorAll('.quark-tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    modal.querySelectorAll('.quark-tab').forEach(t => t.classList.remove('active'));
                    modal.querySelectorAll('.quark-tab-content').forEach(c => c.classList.remove('active'));

                    e.target.classList.add('active');
                    const tabName = e.target.getAttribute('data-tab');
                    modal.querySelector(`[data-content="${tabName}"]`).classList.add('active');
                });
            });

            modal.querySelectorAll('.quark-share-mode-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    modal.querySelectorAll('.quark-share-mode-btn').forEach(node => node.classList.remove('active'));
                    btn.classList.add('active');
                    State.setShareDownloadMode(btn.getAttribute('data-share-mode'));
                });
            });

            modal.querySelector('#quark-share-target-select')?.addEventListener('change', (e) => {
                State.shareTargetFolderId = e.target.value;
            });

            const bindShareTreeToggleEvents = () => {
                modal.querySelectorAll('.quark-share-tree-toggle').forEach(btn => {
                    btn.addEventListener('click', async (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        const path = btn.getAttribute('data-path') || '';
                        logShareTreeDebug('arrow-click', { path });
                        const folderItem = btn.closest('.quark-file-item[data-dir="1"]');
                        const loadedNow = await ensureShareFolderChildrenLoaded(folderItem);
                        if (loadedNow) {
                            return;
                        }
                        toggleShareTreeNode(path, btn);
                    });
                });
            };

            modal.addEventListener('click', async (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) {
                    return;
                }
                const toggleTarget = target.closest('.quark-file-item[data-dir="1"]');
                if (!toggleTarget) {
                    return;
                }
                const excludedTarget = target.closest('.quark-share-check, .quark-share-tree-toggle, .quark-file-btn, a');
                logShareTreeDebug('row-click', {
                    path: toggleTarget.getAttribute('data-path') || '',
                    excluded: Boolean(excludedTarget),
                    tagName: target.tagName,
                    className: typeof target.className === 'string' ? target.className : ''
                });
                if (excludedTarget) {
                    return;
                }
                const path = toggleTarget.getAttribute('data-path') || '';
                const loadedNow = await ensureShareFolderChildrenLoaded(toggleTarget);
                if (loadedNow) {
                    return;
                }
                toggleShareTreeNode(path, toggleTarget.querySelector('.quark-share-tree-toggle'));
            });

            const bindShareCheckboxEvents = () => {
                modal.querySelectorAll('.quark-share-check').forEach(input => {
                    input.addEventListener('change', () => {
                        const currentPath = input.getAttribute('data-path') || '';
                        const allItems = isShareMode ? (State.shareTreeData.length ? State.shareTreeData : data) : data;
                        const currentItem = allItems.find(item => item.fid === input.getAttribute('data-fid'));
                        if (currentItem?.isDir || currentItem?.file_type === 0) {
                            modal.querySelectorAll('.quark-share-check').forEach(other => {
                                const otherPath = other.getAttribute('data-path') || '';
                                if (other !== input && otherPath.startsWith(`${currentPath}/`)) {
                                    other.checked = input.checked;
                                }
                            });
                        }
                        State.shareSelectedIds = Array.from(modal.querySelectorAll('.quark-share-check:checked')).map(node => node.getAttribute('data-fid')).filter(Boolean);
                    });
                });
            };

            const rerenderShareFileList = (shareItems) => {
                const fileList = modal.querySelector('#quark-file-list');
                if (!fileList || typeof options.renderShareFileList !== 'function') return;
                fileList.innerHTML = options.renderShareFileList(shareItems);
                bindShareTreeToggleEvents();
                bindShareCheckboxEvents();
                updateShareTreeVisibility();
            };

            bindShareTreeToggleEvents();
            bindShareCheckboxEvents();
            updateShareTreeVisibility();

            document.getElementById('quark-select-all')?.addEventListener('click', () => {
                const checkboxes = modal.querySelectorAll('.quark-share-check');
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                checkboxes.forEach(cb => { cb.checked = !allChecked; });
                State.shareSelectedIds = Array.from(modal.querySelectorAll('.quark-share-check:checked')).map(node => node.getAttribute('data-fid')).filter(Boolean);
                const btn = document.getElementById('quark-select-all');
                if (btn) btn.innerHTML = `${ICON('checkCircle')} ${allChecked ? L.selectAll : L.deselectAll}`;
            });

            document.getElementById('quark-copy-ua')?.addEventListener('click', () => {
                GM_setClipboard('quark-cloud-drive/2.5.20');
                Utils.toast(L.uaCopied);
            });

            document.getElementById('quark-send-idm')?.addEventListener('click', async () => {
                if (isShareMode) {
                    await handleShareAction(null, runIdmAction);
                    return;
                }
                const selectedFiles = isTreeMode ? getShareItemsFromSelection() : data;
                console.log('[夸克网盘下载助手] IDM下载，选择文件数:', selectedFiles.length);
                await runIdmAction(selectedFiles.filter(file => file.download_url));
            });

            document.getElementById('quark-send-aria2')?.addEventListener('click', async () => {
                if (isShareMode) {
                    await handleShareAction(null, runAria2Action);
                    return;
                }
                const selectedFiles = isTreeMode ? getShareItemsFromSelection() : data;
                console.log('[夸克网盘下载助手] Aria2下载，选择文件数:', selectedFiles.length);
                const filesToDownload = selectedFiles.filter(f => f.download_url);
                const content = Utils.generateAria2Commands(filesToDownload);
                GM_setClipboard(content);
                Utils.toast(`aria2 ${L.copied}`);
            });

            document.getElementById('quark-send-curl')?.addEventListener('click', async () => {
                if (isShareMode) {
                    await handleShareAction(null, runCurlAction);
                    return;
                }
                const selectedFiles = isTreeMode ? getShareItemsFromSelection() : data;
                console.log('[夸克网盘下载助手] Curl下载，选择文件数:', selectedFiles.length);
                const filesToDownload = selectedFiles.filter(f => f.download_url);
                const content = Utils.generateCurlCommands(filesToDownload);
                GM_setClipboard(content);
                Utils.toast(`cURL ${L.copied}`);
            });

            document.getElementById('quark-send-motrix')?.addEventListener('click', async () => {
                if (isShareMode) {
                    await handleShareAction(null, runMotrixAction);
                    return;
                }
                const selectedFiles = isTreeMode ? getShareItemsFromSelection() : data;
                console.log('[夸克网盘下载助手] Motrix下载，选择文件数:', selectedFiles.length);
                const filesToDownload = selectedFiles.filter(f => f.download_url);
                console.log('[夸克网盘下载助手] Motrix实际下载数:', filesToDownload.length);
                const count = await Utils.sendFilesToMotrix(filesToDownload);
                if (count > 0) {
                    Utils.toast(`${L.motrixBatchSent}`);
                }
            });

            document.getElementById('quark-theme-select')?.addEventListener('change', (e) => {
                State.setTheme(e.target.value);
            });

            document.getElementById('quark-lang-select')?.addEventListener('change', (e) => {
                State.setLang(e.target.value);
                Utils.toast('语言已更改，刷新页面后生效');
            });

            document.getElementById('quark-motrix-rpc-url')?.addEventListener('change', (e) => {
                State.setMotrixRpcUrl(e.target.value);
                Utils.toast(L.copied);
            });

            document.getElementById('quark-motrix-rpc-token')?.addEventListener('change', (e) => {
                State.setMotrixRpcToken(e.target.value);
                Utils.toast(L.copied);
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        },

        showSettingsWindow: () => {
            UI.showResultWindow([]);
            setTimeout(() => {
                document.querySelector('[data-tab="settings"]')?.click();
            }, 100);
        },

        removeModal: () => {
            const old = document.getElementById('quark-modal');
            if (old) old.remove();
        },

        showSettingsWindow: () => {
            UI.showResultWindow([]);
            setTimeout(() => {
                document.querySelector('[data-tab="settings"]')?.click();
            }, 100);
        }
    };

    // ==================== 初始化 ====================
    setTimeout(() => {
        App.init();
        console.log(`[夸克网盘下载助手] v${CONFIG.VERSION} 已加载`);

        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                setTimeout(App.init, 1000);
            }
        }).observe(document, { subtree: true, childList: true });

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (State.theme === 'auto') {
                UI.applyTheme();
            }
        });
    }, 1000);
})();
