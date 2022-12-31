#include <string>

typedef signed int s32;
typedef unsigned int u32;

struct CacheBlock {
	bool valid, modified;
	u32 clk, tag, setIdx;
	u32* data;
};

class Cache {
public:
	// initializer
	Cache(u32 blockSize, u32 setNum, u32 assocNum, Cache* next, std::string name="cache");
	Cache(u32 blockSize, std::string name="main mem");
	~Cache(void);
	// basic info
	const std::string name;
	const u32 blockSize, setNum, assocNum, blockNum;
	// read & write & flush
	u32 readWord(u32 addr);
	void writeWord(u32 addr, u32 val);
	void flush(bool flushAll=false);
	// helper
	void setLatency(u32 hitLatency, u32 missLatency);
	u32 getTag(u32 addr);
	u32 getSetIdx(u32 addr);
	u32 getWordIdx(u32 addr);
	auto buildAddr(u32 tag, u32 setIdx);
	void details(bool showAll=false);
private:
	// basic info
	u32 clk, readCounter, writeCounter, missCounter;
	u32 hitLatency, missLatency;
	CacheBlock* blocks;
	Cache* nextLayer;
	// private helper
	s32 getValidBlock(u32 addr);
	s32 getEmptyBlock(u32 addr);
	s32 getReplaceableBlock(u32 addr);
	s32 loadBlock(u32 addr);
};
