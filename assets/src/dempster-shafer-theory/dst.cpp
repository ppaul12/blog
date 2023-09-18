#include <initializer_list>

#include <Eigen/Core>

template<size_t size>
class DST {
    template<typename T>
    using Vector = Eigen::Array<T, size, 1>;
    template<typename T>
    using Matrix = Eigen::Array<T, size, size>;

public:
    DST(std::initializer_list<Vector<float>> BPAs) {
        // init the mask table
        for (auto row { 0 }; row < size; ++row) {
            for (auto col { 0 }; col < size; ++col) {
                this->mask(row, col) = row & col;
            }
        }
        // calculate combined BPA
        auto iter { BPAs.begin() };
        this->set(*iter++);
        while (iter != BPAs.end()) {
            this->combine(*iter++);
        }
    }

    void set(Vector<float> value) {
        this->BPA = value;
    }

    void combine(Vector<float> value) {
        const Matrix<float> product { this->BPA.replicate(1, size).rowwise() * value.transpose() };
        for (auto idx { 1 }; idx < size; ++idx) {
            this->BPA(idx) = ((this->mask == idx).template cast<float>() * product).sum();
        }
        this->BPA /= ((this->mask != 0).template cast<float>() * product).sum();
    }

    Vector<float> mass() {
        return this->BPA;
    }

    template<typename T>
    float mass(T event) {
        return this->BPA.coeff(static_cast<int>(event));
    }

    Vector<float> belief() {
        Matrix<size_t> filter;
        for (auto row { 1 }; row < size; ++row) {
            filter.row(row) = row;
        }
        return ((this->mask >= filter).template cast<float>().colwise() * this->BPA).colwise().sum();
    }

    template<typename T>
    float belief(T event){
        return this->belief().coeff(static_cast<int>(event));
    }

    Vector<float> plausibility() {
        return ((this->mask != 0).template cast<float>().colwise() * this->BPA).colwise().sum();
    }

    template<typename T>
    float plausibility(T event) {
        return this->plausibility().coeff(static_cast<int>(event));
    }

private:
    Vector<float> BPA;
    Matrix<size_t> mask;
};
