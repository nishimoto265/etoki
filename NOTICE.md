# 使っているもの

etoki 本体は MIT ライセンスです。次のものを使っています。

## 道具に入っているデータ

| ファイル | 元 | ライセンス |
|---|---|---|
| `data/hepburn.json` | [misaki](https://github.com/hexgrad/misaki) の `cutlet.py` の表（元は [cutlet](https://github.com/polm/cutlet)） | Apache-2.0（misaki）、MIT（cutlet、Copyright (c) 2020 Paul O'Leary McCann） |
| `data/ja_words.json` | misaki の `data/ja_words.txt` | Apache-2.0 |
| `src/g2p-ja.js` | misaki の `ja.py`・`cutlet.py`・`num2kana.py` の処理を JavaScript に移したもの | Apache-2.0、MIT |

## 初めて使うときにダウンロードするもの

| もの | 元 | ライセンス |
|---|---|---|
| 読み上げのモデル | [onnx-community/Kokoro-82M-v1.0-ONNX](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX)（元は [hexgrad/Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M)） | Apache-2.0 |
| 声 jf_gongitsune・jf_nezumi・jf_tebukuro・jm_kumo | 学習に [Koniwa](https://github.com/koniwa/koniwa) の録音を使っている | 録音は CC BY 3.0。ページの「音声:」の欄に出典を出す |
| 日本語の辞書 | [kuromoji.js](https://github.com/takuyaa/kuromoji.js)（IPADIC） | Apache-2.0、IPADIC のライセンス |
| アイコン | [lucide-static](https://lucide.dev) | ISC |
| 英語の読みの変換 | [phonemizer](https://github.com/xenova/phonemizer)（Apache-2.0。中に eSpeak NG（GPL-3.0）を含む）。`src/g2p-en.js` は [kokoro-js](https://github.com/hexgrad/kokoro)（Apache-2.0）の処理を移したもの | |
| 実行の部品 | onnxruntime-node（MIT）、playwright（Apache-2.0）、js-yaml（MIT） | |

jf_alpha の学習データの出どころは、Kokoro の公開ページに書かれていません。
