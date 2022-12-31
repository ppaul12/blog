#include "cache.h"
#include <cstdio>

#define LOG_1(n) (((n) < 1 << 1) ? 0 : 1)
#define LOG_2(n) (((n) < 1 << 2) ? LOG_1(n) : (2 + LOG_1((n) >> 2)))
#define LOG_4(n) (((n) < 1 << 4) ? LOG_2(n) : (4 + LOG_2((n) >> 4)))
#define LOG_8(n) (((n) < 1 << 8) ? LOG_4(n) : (8 + LOG_4((n) >> 8)))
#define LOG(n)   (((n) < 1 << 16) ? LOG_8(n) : (16 + LOG_8((n) >> 16)))

Cache::Cache(u32 blockSize, u32 setNum, u32 assocNum, Cache* next, std::string name):
    name(name),
    blockSize(blockSize),
    setNum(setNum), assocNum(assocNum), blockNum(setNum * assocNum),
    clk(0), readCounter(0), writeCounter(0), missCounter(0),
    hitLatency(1), missLatency(1),
    nextLayer(next)
{
    this->blocks = new CacheBlock [this->blockNum];
    for (u32 i = 0; i < this->blockNum; i++) {
        this->blocks[i].valid = false;
        this->blocks[i].data = new u32 [this->blockSize];
    }
}

Cache::Cache(u32 blockSize, std::string name):
    Cache(blockSize, 1, 1, nullptr, name)
{
    (*this->blocks).valid = true;
}

Cache::~Cache(void) {
    for (u32 i = 0; i < this->blockNum; i++)
        delete [] this->blocks[i].data;
    delete [] this->blocks;
}

void Cache::setLatency(u32 hitLatency, u32 missLatency) {
    assert (hitLatency > 0 && missLatency > 0);
    this->hitLatency = hitLatency;
    this->missLatency = missLatency;
}

u32 selectBits(u32 val, u32 start, u32 end) {
    // end not included
    return (val >> start) & ((1 << (end - start)) - 1);
}

u32 Cache::getTag(u32 addr) {
    u32 setIdxBits = LOG(this->setNum);
    u32 wordIdxBits = LOG(this->blockSize);
    return selectBits(addr, setIdxBits + wordIdxBits + 2, 31);
}

u32 Cache::getSetIdx(u32 addr) {
    u32 setIdxBits = LOG(this->setNum);
    u32 wordIdxBits = LOG(this->blockSize);
    return selectBits(addr, wordIdxBits + 2, setIdxBits + wordIdxBits + 2);
}

u32 Cache::getWordIdx(u32 addr) {
    u32 wordIdxBits = LOG(this->blockSize);
    return selectBits(addr, 2, wordIdxBits + 2);    
}

auto Cache::buildAddr(u32 tag, u32 setIdx) {
    u32 setIdxBits = LOG(this->setNum);
    u32 wordIdxBits = LOG(this->blockSize);
    return [=](u32 wordIdx){return ((tag << setIdxBits | setIdx) << wordIdxBits | wordIdx) << 2;};
}

void Cache::details(bool showAll) {
    printf("%s\n", this->name.c_str());
    for (u32 i = 0; i < this->blockNum; i++) {
        printf("block%d\t", i);
        printf("set%d\t", this->blocks[i].setIdx);
        printf("%s\t", this->blocks[i].valid ? "valid" : "invalid");
        printf("%s\n", this->blocks[i].modified ? "modified" : "unmodified");
        auto targetAddr = this->buildAddr(this->blocks[i].tag, this->blocks[i].setIdx);
        for (u32 j = 0; j < this->blockSize; j++)
            printf("  %04X: %08X\n", targetAddr(j), this->blocks[i].data[j]);
    }
    printf("read: %u, write: %u, miss: %u\n\n", this->readCounter, this->writeCounter, this->missCounter);

    if (showAll && this->nextLayer != nullptr) this->nextLayer->details(showAll);
}

u32 Cache::readWord(u32 addr) {
    this->readCounter++;

    s32 blockIdx = this->getValidBlock(addr);
    if (blockIdx < 0) {
        // miss
        this->clk += missLatency;
        this->missCounter++;
        blockIdx = this->loadBlock(addr);
    } else {
        // hit
        this->clk += this->hitLatency;
    }
    this->blocks[blockIdx].clk = this->clk;
    return this->blocks[blockIdx].data[this->getWordIdx(addr)];
}

void Cache::writeWord(u32 addr, u32 val) {
    this->writeCounter++;

    s32 blockIdx = this->getValidBlock(addr);
    if (blockIdx < 0) {
        // miss
        this->clk += this->missLatency;
        this->missCounter++;
        blockIdx = this->loadBlock(addr);
    } else {
        // hit
        this->clk += this->hitLatency;
    }
    this->blocks[blockIdx].clk = this->clk;
    this->blocks[blockIdx].modified = true;
    this->blocks[blockIdx].data[this->getWordIdx(addr)] = val;
}

void Cache::flush(bool flushAll) {
    if (this->nextLayer == nullptr) return;

    for (u32 i = 0; i < this->blockNum; i++) {
        if (!this->blocks[i].valid) continue;
        if (this->blocks[i].modified) {
            auto targetAddr = this->buildAddr(this->blocks[i].tag, this->blocks[i].setIdx);
            for (u32 j = 0; j < this->blockSize; j++) {
                this->nextLayer->writeWord(targetAddr(j), this->blocks[i].data[j]);
            }
        }
        this->blocks[i].valid = false;
    }

    if (flushAll) this->nextLayer->flush(flushAll);
}

s32 Cache::getValidBlock(u32 addr) {
    s32 baseIdx = this->getSetIdx(addr) * this->assocNum;
    u32 baseTag = this->getTag(addr);
    for (s32 i = 0; i < this->assocNum; i++) {
        if (!this->blocks[baseIdx + i].valid) continue;
        if (this->blocks[baseIdx + i].tag ^ baseTag) continue;
        return baseIdx + i;
    }
    return -1;
}

s32 Cache::getEmptyBlock(u32 addr) {
    s32 baseIdx = this->getSetIdx(addr) * this->assocNum;
    for (s32 i = 0; i < this->assocNum; i++) {
        if (!this->blocks[baseIdx + i].valid)
            return baseIdx + i;
    }
    return -1;
}

s32 Cache::getReplaceableBlock(u32 addr) {
    s32 baseIdx = this->getSetIdx(addr) * this->assocNum;
    u32 minClk = ~0;
    s32 blockIdx = -1;
    for (s32 i = 0; i < this->assocNum; i++) {
        if (this->blocks[baseIdx + i].clk < minClk) {
            minClk = this->blocks[baseIdx + i].clk;
            blockIdx = baseIdx + i;
        }
    }
    return blockIdx;
}

s32 Cache::loadBlock(u32 addr) {
    s32 blockIdx = this->getEmptyBlock(addr);
    // write back
    if (blockIdx < 0) {
        // all blocks occupied
        blockIdx = this->getReplaceableBlock(addr);
        if (this->blocks[blockIdx].modified) {
            auto targetAddr = this->buildAddr(this->blocks[blockIdx].tag, this->blocks[blockIdx].setIdx);
            for (u32 i = 0; i < this->blockSize; i++) {
                this->nextLayer->writeWord(targetAddr(i), this->blocks[blockIdx].data[i]);
            }
        }
    }
    // load block
    this->blocks[blockIdx].valid = true;
    this->blocks[blockIdx].modified = false;
    this->blocks[blockIdx].tag = this->getTag(addr);
    this->blocks[blockIdx].setIdx = this->getSetIdx(addr);
    auto targetAddr = this->buildAddr(this->blocks[blockIdx].tag, this->blocks[blockIdx].setIdx);
    for (u32 i = 0; i < this->blockSize; i++) {
        this->blocks[blockIdx].data[i] = this->nextLayer->readWord(targetAddr(i));
    }
    return blockIdx;
}
